import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      coordinates: {
        type: [Number], // [lat, lng]
        required: true,
        validate: {
          validator: (arr) => arr.length === 2 && !isNaN(arr[0]) && !isNaN(arr[1]),
          message: 'Coordinates must be [latitude, longitude]',
        },
      },
      address: { type: String, required: true },
      district: { type: String, default: 'Medical Center District' },
    },
    traumaLevel: {
      type: String,
      required: true,
      enum: ['Level 1 Trauma', 'Level 2 Trauma', 'Level 3 Trauma', 'Emergency Center'],
      default: 'Level 1 Trauma',
    },
    specialties: {
      type: [String],
      default: [
        'Adult Level 1 Trauma',
        'Comprehensive Stroke Center',
        '24/7 STEMI Cath Lab',
        'Critical Care Resuscitation',
      ],
    },
    capacity: {
      totalBeds: { type: Number, default: 450 },
      availableBeds: { type: Number, default: 42 },
      icuTotal: { type: Number, default: 60 },
      icuAvailable: { type: Number, default: 8 },
      orAvailable: { type: Number, default: 4 },
      pediatricAvailable: { type: Number, default: 12 },
    },
    status: {
      type: String,
      required: true,
      enum: ['ACCEPTING_ALL', 'ACCEPTING_CRITICAL_ONLY', 'DIVERTING_AMBULANCES'],
      default: 'ACCEPTING_ALL',
    },
    helipad: {
      type: Boolean,
      default: true,
    },
    contactPhone: {
      type: String,
      default: '+1 (555) 911-4000',
    },
    lastCapacityUpdate: {
      type: Date,
      default: Date.now,
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Hospital = mongoose.model('Hospital', HospitalSchema);
