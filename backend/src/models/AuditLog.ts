import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const AuditLog = model('AuditLog', AuditLogSchema);
export default AuditLog;
