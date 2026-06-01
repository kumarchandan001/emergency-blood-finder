import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
  requestId: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'Donor',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Sent', 'Accepted', 'Rejected'],
    default: 'Sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Notification = model('Notification', NotificationSchema);
export default Notification;
