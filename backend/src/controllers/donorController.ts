import { Response } from 'express';
import { Donor } from '../models/Donor';
import { User } from '../models/User';
import { calculateDistance, calculateScore } from '../utils/matching';

export const updateProfile = async (req: any, res: Response) => {
  const { phone, age, gender, city, coordinates, lastDonationDate, available } = req.body;

  try {
    let donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    if (phone) donor.phone = phone;
    if (age) donor.age = age;
    if (gender) donor.gender = gender;
    if (city) donor.city = city;
    if (available !== undefined) donor.available = available;
    if (lastDonationDate) donor.lastDonationDate = new Date(lastDonationDate);

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      donor.location = {
        type: 'Point',
        coordinates: coordinates,
      };
    }

    await donor.save();

    res.status(200).json({
      message: 'Donor profile updated successfully',
      donor,
    });
  } catch (error: any) {
    console.error('Update donor profile error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

export const toggleAvailability = async (req: any, res: Response) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    donor.available = !donor.available;
    await donor.save();

    res.status(200).json({
      message: `Availability toggled to ${donor.available ? 'Available' : 'Unavailable'}`,
      available: donor.available,
      donor,
    });
  } catch (error: any) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error toggling availability', error: error.message });
  }
};

export const searchDonors = async (req: any, res: Response) => {
  const { bloodGroup, latitude, longitude, radiusKm } = req.query;

  try {
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and Longitude are required for search location mapping.' });
    }

    const searchLat = parseFloat(latitude);
    const searchLon = parseFloat(longitude);
    const maxRadius = radiusKm ? parseFloat(radiusKm) : 50; // default 50km

    let query: any = { available: true };
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Retrieve donors
    const donors = await Donor.find(query).populate('userId', 'name email');

    // Filter by distance and rank
    const rankedDonors = donors
      .map((d: any) => {
        const donorLon = d.location.coordinates[0];
        const donorLat = d.location.coordinates[1];
        const distance = calculateDistance(searchLat, searchLon, donorLat, donorLon);
        const score = calculateScore(distance, d.available, d.lastDonationDate);
        return {
          id: d._id,
          name: d.userId.name,
          email: d.userId.email,
          bloodGroup: d.bloodGroup,
          phone: d.phone,
          age: d.age,
          gender: d.gender,
          city: d.city,
          latitude: donorLat,
          longitude: donorLon,
          lastDonationDate: d.lastDonationDate,
          isEligible: d.eligibilityStatus.isEligible,
          eligibilityReason: d.eligibilityStatus.reason,
          distance,
          score,
        };
      })
      // Filter out ineligible donors (score = 0) and filter by radius
      .filter((d) => d.score > 0 && d.distance <= maxRadius)
      // Sort by score (descending) and then distance (ascending)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distance - b.distance;
      });

    res.status(200).json(rankedDonors);
  } catch (error: any) {
    console.error('Search donors error:', error);
    res.status(500).json({ message: 'Server error searching donors', error: error.message });
  }
};
