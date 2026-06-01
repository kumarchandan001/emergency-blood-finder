import { Response } from 'express';
import { Request as BloodRequest } from '../models/Request';
import { Donor } from '../models/Donor';
import { Notification } from '../models/Notification';
import { COMPATIBILITY_MAP, calculateDistance, calculateScore } from '../utils/matching';

export const createRequest = async (req: any, res: Response) => {
  const { patientName, hospitalName, bloodGroup, unitsRequired, urgency, coordinates } = req.body;

  try {
    if (!patientName || !hospitalName || !bloodGroup || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Missing required parameters or invalid coordinates' });
    }

    const bloodRequest = await BloodRequest.create({
      patientName,
      hospitalName,
      bloodGroup,
      unitsRequired: unitsRequired || 1,
      urgency: urgency || 'High',
      location: {
        type: 'Point',
        coordinates,
      },
      createdBy: req.user._id,
    });

    // Smart Matchmaking: Find compatible donors
    const compatibleGroups = COMPATIBILITY_MAP[bloodGroup] || [bloodGroup];
    const patientLon = coordinates[0];
    const patientLat = coordinates[1];

    // Find all donors matching compatible blood groups who are available
    const candidates = await Donor.find({
      bloodGroup: { $in: compatibleGroups },
      available: true,
    }).populate('userId', 'name email');

    // Rank candidates by distance and score
    const rankedCandidates = candidates
      .map((d: any) => {
        const donorLon = d.location.coordinates[0];
        const donorLat = d.location.coordinates[1];
        const distance = calculateDistance(patientLat, patientLon, donorLat, donorLon);
        const score = calculateScore(distance, d.available, d.lastDonationDate);
        return { donor: d, distance, score };
      })
      // Only keep eligible ones within a reasonable emergency distance (e.g. 30km)
      .filter((c) => c.score > 0 && c.distance <= 30)
      .sort((a, b) => b.score - a.score);

    // Limit notifications to top 5 closest/best matched donors
    const alertList = rankedCandidates.slice(0, 5);

    const notifications = [];
    for (const item of alertList) {
      const msg = `URGENT: ${bloodGroup} blood needed for patient ${patientName} at ${hospitalName} (${item.distance} km away). Urgency: ${urgency}.`;
      
      const notification = await Notification.create({
        requestId: bloodRequest._id,
        donorId: item.donor._id,
        message: msg,
        status: 'Sent',
      });

      notifications.push({
        id: notification._id,
        donorName: item.donor.userId.name,
        donorPhone: item.donor.phone,
        distance: item.distance,
        message: msg,
      });

      // Simulating external communications in stdout logs
      console.log(`[ALERT SIMULATION] SMS/Email dispatched to ${item.donor.userId.email} (Phone: ${item.donor.phone}): "${msg}"`);
    }

    res.status(201).json({
      message: 'Emergency request created and nearby donors notified.',
      request: bloodRequest,
      notifiedDonorsCount: notifications.length,
      alertsDispatched: notifications,
    });
  } catch (error: any) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error creating request', error: error.message });
  }
};

export const getMyRequests = async (req: any, res: Response) => {
  try {
    const requests = await BloodRequest.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error: any) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error retrieving requests', error: error.message });
  }
};

export const getAllRequests = async (req: any, res: Response) => {
  try {
    const requests = await BloodRequest.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error: any) {
    console.error('Get all requests error:', error);
    res.status(500).json({ message: 'Server error retrieving requests', error: error.message });
  }
};

export const getRequestDetails = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const request = await BloodRequest.findById(id).populate('createdBy', 'name email');
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const notifications = await Notification.find({ requestId: id })
      .populate({
        path: 'donorId',
        populate: { path: 'userId', select: 'name email' },
      });

    res.status(200).json({
      request,
      notifications: notifications.map((n: any) => ({
        id: n._id,
        donorName: n.donorId.userId.name,
        donorEmail: n.donorId.userId.email,
        phone: n.donorId.phone,
        status: n.status,
        updatedAt: n.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get request details error:', error);
    res.status(500).json({ message: 'Server error retrieving request details', error: error.message });
  }
};

export const getDonorAlerts = async (req: any, res: Response) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found for this user' });
    }

    const alerts = await Notification.find({ donorId: donor._id })
      .populate('requestId')
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error: any) {
    console.error('Get donor alerts error:', error);
    res.status(500).json({ message: 'Server error retrieving alerts', error: error.message });
  }
};

export const respondToAlert = async (req: any, res: Response) => {
  const { alertId } = req.params;
  const { status } = req.body; // 'Accepted' or 'Rejected'

  try {
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid response status. Must be Accepted or Rejected' });
    }

    const notification = await Notification.findById(alertId);
    if (!notification) {
      return res.status(404).json({ message: 'Alert notification not found' });
    }

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor || notification.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this notification' });
    }

    notification.status = status;
    await notification.save();

    // If accepted, mark request as fulfilled
    if (status === 'Accepted') {
      const bloodRequest = await BloodRequest.findById(notification.requestId);
      if (bloodRequest) {
        bloodRequest.status = 'Fulfilled';
        await bloodRequest.save();
        
        // Cooldown donor: update last donation date to today
        donor.lastDonationDate = new Date();
        await donor.save();
      }
    }

    res.status(200).json({
      message: `Notification marked as ${status}`,
      notification,
    });
  } catch (error: any) {
    console.error('Respond to alert error:', error);
    res.status(500).json({ message: 'Server error updating alert', error: error.message });
  }
};
