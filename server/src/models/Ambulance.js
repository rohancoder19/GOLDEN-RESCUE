import mongoose from 'mongoose';

const AmbulanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    callsign: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['ADVANCED_LIFE_SUPPORT', 'BASIC_LIFE_SUPPORT', 'MOBILE_ICU', 'RAPID_RESPONSE'],
      default: 'ADVANCED_LIFE_SUPPORT',
    },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'AT_SCENE', 'TRANSPORTING', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
      index: true,
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
      address: { type: String, default: 'Station Dispatch Bay' },
      heading: { type: Number, default: 0 },
      speedKmh: { type: Number, default: 0 },
    },
    assignedIncidentId: {
      type: String,
      default: null,
      index: true,
    },
    paramedicCrew: [
      {
        name: { type: String, required: true },
        role: { type: String, default: 'Lead Paramedic' },
        certification: { type: String, default: 'NRP / Critical Care' },
      },
    ],
    equipment: {
      type: [String],
      default: [
        'Zoll X Series Advanced Monitor/Defibrillator',
        'Hamilton-T1 Transport Ventilator',
        'LUCAS 3 Mechanical CPR Device',
        'Butterfly iQ+ Point-of-Care Ultrasound',
        'Video Laryngoscope GlideScope',
      ],
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 92,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 98,
    },
    baseStation: {
      type: String,
      default: 'Metro Central Station 1',
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

export const Ambulance = mongoose.model('Ambulance', AmbulanceSchema);
