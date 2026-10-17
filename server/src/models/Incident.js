import mongoose from 'mongoose';

const IncidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'TRAFFIC_COLLISION',
        'CARDIAC_ARREST',
        'STROKE_NEURO',
        'RESPIRATORY_DISTRESS',
        'INDUSTRIAL_FIRE',
        'HAZMAT_EXPOSURE',
        'PEDIATRIC_TRAUMA',
        'FALL_INJURY',
        'OTHER',
      ],
      default: 'OTHER',
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },
    priorityScore: {
      type: Number,
      min: 1,
      max: 100,
      default: 50,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'REPORTED',
        'TRIAGED',
        'DISPATCHED',
        'EN_ROUTE',
        'ON_SCENE',
        'TRANSPORTING',
        'RESOLVED',
        'CANCELLED',
      ],
      default: 'REPORTED',
      index: true,
    },
    location: {
      address: { type: String, required: true },
      coordinates: {
        type: [Number], // [lat, lng]
        required: true,
        validate: {
          validator: (arr) => arr.length === 2 && !isNaN(arr[0]) && !isNaN(arr[1]),
          message: 'Coordinates must be [latitude, longitude]',
        },
      },
      district: { type: String, default: 'Central Metro' },
      crossStreet: { type: String, default: '' },
    },
    source: {
      type: String,
      enum: ['911_VOICE', 'CCTV_AI', 'CITIZEN_MOBILE', 'IOT_SENSOR', 'OPERATOR_MANUAL', 'VOICE_REPORT'],
      default: '911_VOICE',
    },
    callerInfo: {
      name: { type: String, default: 'Anonymous Reporter' },
      phone: { type: String, default: '+1 (555) 019-2834' },
      callbackVerified: { type: Boolean, default: true },
    },
    assignedAmbulanceId: {
      type: String,
      default: null,
      index: true,
    },
    assignedAmbulanceCallsign: {
      type: String,
      default: null,
    },
    recommendedHospitalId: {
      type: String,
      default: null,
    },
    recommendedHospitalName: {
      type: String,
      default: null,
    },
    routeData: {
      waypoints: { type: [[Number]], default: [] },
      distanceKm: { type: Number, default: 0 },
      etaMinutes: { type: Number, default: 0 },
      trafficDelayMinutes: { type: Number, default: 0 },
      routeGeometry: { type: String, default: '' },
    },
    aiTriage: {
      summary: { type: String, default: '' },
      confidence: { type: Number, min: 0, max: 100, default: 92 },
      factors: { type: [String], default: [] },
      agentsTrail: [
        {
          agent: { type: String, required: true },
          status: { type: String, default: 'SUCCESS' },
          timestamp: { type: Date, default: Date.now },
          durationMs: { type: Number, default: 45 },
          output: { type: mongoose.Schema.Types.Mixed },
        },
      ],
      clinicalRecommendation: { type: String, default: '' },
      clinicalDisclaimer: { type: String, default: 'DECISION SUPPORT ONLY: Not an authoritative clinical diagnosis.' },
    },
    timeline: [
      {
        stage: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        actor: { type: String, default: 'AI Orchestrator' },
        note: { type: String, default: '' },
      },
    ],
    timestamps: {
      reportedAt: { type: Date, default: Date.now },
      triagedAt: { type: Date, default: null },
      dispatchedAt: { type: Date, default: null },
      enRouteAt: { type: Date, default: null },
      arrivedAt: { type: Date, default: null },
      transportingAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
    },
    dataSource: {
      type: String,
      enum: ['LIVE_EXTERNAL', 'USER_SUBMITTED', 'STORED_DATABASE', 'SIMULATED_DEMO'],
      default: 'STORED_DATABASE',
      index: true,
    },
    isSimulated: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

IncidentSchema.index({ status: 1, severity: 1 });
IncidentSchema.index({ createdAt: -1 });

export const Incident = mongoose.model('Incident', IncidentSchema);

