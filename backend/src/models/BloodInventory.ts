import { Schema, model } from 'mongoose';

const BloodInventorySchema = new Schema({
  bloodGroup: {
    type: String,
    required: true,
    unique: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  availableUnits: {
    type: Number,
    required: true,
    default: 10,
    min: [0, 'Available units cannot be negative'],
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const BloodInventory = model('BloodInventory', BloodInventorySchema);
export default BloodInventory;
