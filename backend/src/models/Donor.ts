import { Schema, model } from 'mongoose';

const DonorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  lastDonationDate: {
    type: Date,
  },
  available: {
    type: Boolean,
    default: true,
  },
  eligibilityStatus: {
    isEligible: {
      type: Boolean,
      default: true,
    },
    reason: {
      type: String,
      default: 'Not verified by AI checker yet',
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
});

// Index location field for GeoJSON proximity queries
DonorSchema.index({ location: '2dsphere' });

export const Donor = model('Donor', DonorSchema);
export default Donor;
