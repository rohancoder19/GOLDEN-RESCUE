import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    operator: {
      name: { type: String, default: 'Dispatcher Delta-7' },
      role: { type: String, default: 'Level 3 Commander' },
      badgeId: { type: String, default: 'GR-8802' },
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    incidentId: {
      type: String,
      default: null,
      index: true,
    },
    targetEntity: {
      entityType: { type: String, enum: ['INCIDENT', 'AMBULANCE', 'HOSPITAL', 'SYSTEM_CONFIG', 'SIMULATION'] },
      entityId: { type: String },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1 (Local Control Terminal)',
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL_DISPATCH', 'OVERRIDE'],
      default: 'INFO',
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
