import { Schema, model } from 'mongoose';

const DonationSchema = new Schema({
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'Donor',
    required: true,
  },
  requestId: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  hospital: {
    type: String,
    required: true,
  },
  donationDate: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
    default: 'Successful emergency donation match',
  },
});

export const Donation = model('Donation', DonationSchema);
export default Donation;
