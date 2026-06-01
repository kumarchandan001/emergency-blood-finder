import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Donor } from '../models/Donor';
import { Request as BloodRequest } from '../models/Request';
import { Notification } from '../models/Notification';
import { BloodInventory } from '../models/BloodInventory';
import { Donation } from '../models/Donation';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blood_bank';

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected. Clearing existing collections...');

    await User.deleteMany({});
    await Donor.deleteMany({});
    await BloodRequest.deleteMany({});
    await Notification.deleteMany({});
    await Donation.deleteMany({});
    await BloodInventory.deleteMany({});

    console.log('Collections cleared. Generating mock data...');

    // 1. Create Recipient Account
    const recipientUser = await User.create({
      name: 'Karan Sharma',
      email: 'karan@gmail.com',
      password: 'password123',
      role: 'recipient',
    });

    // 2. Create Admin Account
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: 'adminpassword',
      role: 'admin',
    });

    // 3. Create Donors
    const donorsData = [
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        password: 'password123',
        bloodGroup: 'O+',
        phone: '+91 9876543210',
        age: 28,
        gender: 'Male',
        city: 'Bangalore',
        coordinates: [77.6012, 12.9785], // ~1.1 km from center [77.5946, 12.9716]
        available: true,
        lastDonationDate: null,
      },
      {
        name: 'Aman Verma',
        email: 'aman@gmail.com',
        password: 'password123',
        bloodGroup: 'O+',
        phone: '+91 9988776655',
        age: 32,
        gender: 'Male',
        city: 'Bangalore',
        coordinates: [77.6250, 12.9620], // ~3.5 km away
        available: true,
        lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago (fully eligible)
      },
      {
        name: 'Ravi Teja',
        email: 'ravi@gmail.com',
        password: 'password123',
        bloodGroup: 'O-',
        phone: '+91 9122334455',
        age: 24,
        gender: 'Male',
        city: 'Bangalore',
        coordinates: [77.6510, 12.9430], // ~6.9 km away
        available: true,
        lastDonationDate: null,
      },
      {
        name: 'Priya Patel',
        email: 'priya@gmail.com',
        password: 'password123',
        bloodGroup: 'AB+',
        phone: '+91 9455667788',
        age: 26,
        gender: 'Female',
        city: 'Bangalore',
        coordinates: [77.5720, 12.9890], // ~3.1 km away
        available: true,
        lastDonationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago (In cooldown! Should get score 0 and be ignored)
      },
      {
        name: 'Neha Roy',
        email: 'neha@gmail.com',
        password: 'password123',
        bloodGroup: 'A+',
        phone: '+91 8899001122',
        age: 29,
        gender: 'Female',
        city: 'Bangalore',
        coordinates: [77.5510, 12.9480], // ~5.4 km away
        available: false, // Not available! Should be ignored in matching
        lastDonationDate: null,
      },
      {
        name: 'Arjun Das',
        email: 'arjun@gmail.com',
        password: 'password123',
        bloodGroup: 'B+',
        phone: '+91 7766554433',
        age: 35,
        gender: 'Male',
        city: 'Bangalore',
        coordinates: [77.6110, 12.9320], // ~4.7 km away
        available: true,
        lastDonationDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), // 150 days ago (Fully eligible)
      },
      {
        name: 'Sneha Rao',
        email: 'sneha@gmail.com',
        password: 'password123',
        bloodGroup: 'O+',
        phone: '+91 9334455667',
        age: 22,
        gender: 'Female',
        city: 'Bangalore',
        coordinates: [77.6320, 12.9890], // ~4.5 km away
        available: true,
        lastDonationDate: null,
      }
    ];

    let idx = 0;
    const seededDonors = [];
    for (const data of donorsData) {
      const u = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'donor',
      });

      const d = await Donor.create({
        userId: u._id,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        city: data.city,
        location: {
          type: 'Point',
          coordinates: data.coordinates,
        },
        lastDonationDate: data.lastDonationDate,
        available: data.available,
        verificationStatus: idx % 2 === 0 ? 'Approved' : 'Pending',
        verificationRemarks: idx % 2 === 0 ? 'Audited by Super Admin' : 'Awaiting admin auditing',
      });
      seededDonors.push(d);
      idx++;
    }

    // Seed Blood Inventory
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const mockUnits = [12, 4, 15, 3, 8, 2, 20, 4]; // Some below default threshold of 5
    for (let i = 0; i < groups.length; i++) {
      await BloodInventory.create({
        bloodGroup: groups[i],
        availableUnits: mockUnits[i],
        lowStockThreshold: 5,
      });
    }

    // Seed a mock Request and Donation
    const mockReq = await BloodRequest.create({
      patientName: 'Suresh Raina',
      hospitalName: 'Apollo Hospital',
      bloodGroup: 'O+',
      unitsRequired: 2,
      urgency: 'Critical',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
      },
      status: 'Fulfilled',
      createdBy: recipientUser._id,
    });

    await Donation.create({
      donorId: seededDonors[0]._id, // Rahul (O+, Approved)
      requestId: mockReq._id,
      bloodGroup: 'O+',
      hospital: 'Apollo Hospital',
      remarks: 'Patient received donation successfully',
    });

    console.log('Successfully seeded database with 1 admin, 1 recipient, and 7 donor accounts.');
    console.log('Demo Credentials:');
    console.log(' - Recipient: karan@gmail.com / password123');
    console.log(' - Admin: admin@gmail.com / adminpassword');
    console.log(' - Donor (O+, available, close): rahul@gmail.com / password123');
    console.log(' - Donor (AB+, in cooldown): priya@gmail.com / password123');
    console.log(' - Donor (A+, unavailable): neha@gmail.com / password123');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedData();
