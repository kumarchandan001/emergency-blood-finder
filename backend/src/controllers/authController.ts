import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Donor } from '../models/Donor';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtsecretkey123!', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, donorDetails } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create base user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'recipient',
    });

    let donorProfile = null;

    // If role is donor, create the donor profile
    if (role === 'donor') {
      if (!donorDetails) {
        // Rollback user creation to prevent orphans
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Donor details are required for donor registration' });
      }

      const { bloodGroup, phone, age, gender, city, coordinates, lastDonationDate } = donorDetails;

      if (!bloodGroup || !phone || !age || !gender || !city) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Missing required donor details' });
      }

      const coords = coordinates && Array.isArray(coordinates) && coordinates.length === 2
        ? coordinates
        : [77.5946, 12.9716]; // Default to Bangalore center if coordinates missing

      donorProfile = await Donor.create({
        userId: user._id,
        bloodGroup,
        phone,
        age,
        gender,
        city,
        location: {
          type: 'Point',
          coordinates: coords,
        },
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : undefined,
        available: true,
      });
    }

    const token = generateToken(user._id.toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      donor: donorProfile,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await Donor.findOne({ userId: user._id });
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      donor: donorProfile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = req.user;
    let donorProfile = null;

    if (user.role === 'donor') {
      donorProfile = await Donor.findOne({ userId: user._id });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      donor: donorProfile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};
