import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { connectDB } from '../config/db.js';

dotenv.config();

export const seedInitialData = async () => {
  console.log('[Seed] 🧹 Clearing previous collections...');
  await Incident.deleteMany({});
  await Ambulance.deleteMany({});
  await Hospital.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('[Seed] 🏥 Seeding Hospitals...');
  const hospitals = await Hospital.insertMany([
    {
      hospitalId: 'HOSP-01',
      name: 'Metro General Trauma & Surgical Institute',
      location: {
        coordinates: [37.7558, -122.4044],
        address: '1001 Potrero Ave, San Francisco, CA',
        district: 'Mission Bay District',
      },
      traumaLevel: 'Level 1 Trauma',
      specialties: [
        'Adult Level 1 Trauma',
        'Comprehensive Stroke Center',
        '24/7 STEMI Cath Lab',
        'Microvascular Replantation',
      ],
      capacity: {
        totalBeds: 520,
        availableBeds: 34,
        icuTotal: 68,
        icuAvailable: 7,
        orAvailable: 3,
        pediatricAvailable: 8,
      },
      status: 'ACCEPTING_ALL',
      helipad: true,
      contactPhone: '+1 (415) 206-8000',
      isSimulated: false,
    },
    {
      hospitalId: 'HOSP-02',
      name: 'UCSF Medical Center & Cardiovascular Care',
      location: {
        coordinates: [37.7631, -122.4578],
        address: '505 Parnassus Ave, San Francisco, CA',
        district: 'Parnassus Heights',
      },
      traumaLevel: 'Level 1 Trauma',
      specialties: [
        'Advanced Cardiovascular ICU',
        'Comprehensive Stroke Center',
        'Neurological Resuscitation',
        'ECMO Extracorporeal Support',
      ],
      capacity: {
        totalBeds: 480,
        availableBeds: 22,
        icuTotal: 56,
        icuAvailable: 5,
        orAvailable: 2,
        pediatricAvailable: 10,
      },
      status: 'ACCEPTING_ALL',
      helipad: true,
      contactPhone: '+1 (415) 476-1000',
      isSimulated: false,
    },
    {
      hospitalId: 'HOSP-03',
      name: 'St. Francis Regional Memorial & Burn Center',
      location: {
        coordinates: [37.7892, -122.4132],
        address: '900 Hyde St, San Francisco, CA',
        district: 'Nob Hill / Downtown',
      },
      traumaLevel: 'Level 2 Trauma',
      specialties: [
        'Bothin Burn Center (Critical Burn ICU)',
        'Hyperbaric Oxygen Therapy',
        'Emergency General Surgery',
      ],
      capacity: {
        totalBeds: 280,
        availableBeds: 18,
        icuTotal: 32,
        icuAvailable: 4,
        orAvailable: 2,
        pediatricAvailable: 0,
      },
      status: 'ACCEPTING_ALL',
      helipad: false,
      contactPhone: '+1 (415) 353-6000',
      isSimulated: false,
    },
    {
      hospitalId: 'HOSP-04',
      name: 'Kaiser Permanente Medical Emergency',
      location: {
        coordinates: [37.7825, -122.4435],
        address: '2425 Geary Blvd, San Francisco, CA',
        district: 'Western Addition',
      },
      traumaLevel: 'Level 2 Trauma',
      specialties: [
        'Acute Stroke Evaluation',
        'Rapid Resuscitation Bay',
        'Critical Care Stepdown',
      ],
      capacity: {
        totalBeds: 310,
        availableBeds: 12,
        icuTotal: 40,
        icuAvailable: 2,
        orAvailable: 1,
        pediatricAvailable: 4,
      },
      status: 'ACCEPTING_CRITICAL_ONLY',
      helipad: false,
      contactPhone: '+1 (415) 833-2000',
      isSimulated: false,
    },
    {
      hospitalId: 'HOSP-05',
      name: 'Mission Community Emergency & Urgent Care',
      location: {
        coordinates: [37.7512, -122.4180],
        address: '3200 16th St, San Francisco, CA',
        district: 'Mission District',
      },
      traumaLevel: 'Emergency Center',
      specialties: [
        'Urgent Medical Stabilization',
        'Minor Trauma & Orthopedics',
        'Pediatric Primary Triage',
      ],
      capacity: {
        totalBeds: 140,
        availableBeds: 4,
        icuTotal: 12,
        icuAvailable: 0,
        orAvailable: 0,
        pediatricAvailable: 2,
      },
      status: 'DIVERTING_AMBULANCES',
      helipad: false,
      contactPhone: '+1 (415) 552-4000',
      isSimulated: false,
    },
  ]);

  console.log('[Seed] 🚑 Seeding Ambulances...');
  const ambulances = await Ambulance.insertMany([
    {
      vehicleId: 'AMB-101',
      callsign: 'Guardian-Alpha',
      type: 'ADVANCED_LIFE_SUPPORT',
      status: 'AVAILABLE',
      location: {
        coordinates: [37.7785, -122.4120],
        address: 'Market St & 6th St Patrol Zone',
        heading: 45,
        speedKmh: 0,
      },
      paramedicCrew: [
        { name: 'Capt. Marcus Vance', role: 'Paramedic Field Supervisor', certification: 'Critical Care Paramedic (FP-C)' },
        { name: 'Elena Rostova', role: 'Flight/Ground Paramedic', certification: 'NRP / ACLS / PALS' },
      ],
      equipment: [
        'Zoll X Series Monitor/Defibrillator',
        'Hamilton-T1 Transport Ventilator',
        'LUCAS 3 CPR Machine',
        'Video Laryngoscope GlideScope',
      ],
      fuelLevel: 94,
      batteryLevel: 98,
      baseStation: 'Station 1 Central Bay',
      isSimulated: false,
    },
    {
      vehicleId: 'AMB-102',
      callsign: 'Rescue-Titan',
      type: 'MOBILE_ICU',
      status: 'AVAILABLE',
      location: {
        coordinates: [37.7645, -122.4080],
        address: '16th & Potrero St Station',
        heading: 180,
        speedKmh: 0,
      },
      paramedicCrew: [
        { name: 'Dr. Sarah Jenkins', role: 'Trauma Fellow / Medical Director', certification: 'MD Emergency Medicine' },
        { name: 'David Cho', role: 'Critical Care Transport Specialist', certification: 'CCP-C / ECMO Trained' },
      ],
      equipment: [
        'Hamilton-T1 Multi-Mode Ventilator',
        'Cardiohelp Portable ECMO Unit',
        'Zoll X Series Pro Defibrillator',
        'Blood Warmer & Rapid Infuser',
      ],
      fuelLevel: 88,
      batteryLevel: 95,
      baseStation: 'Station 7 South Metro',
      isSimulated: false,
    },
    {
      vehicleId: 'AMB-103',
      callsign: 'Life-Echo',
      type: 'ADVANCED_LIFE_SUPPORT',
      status: 'EN_ROUTE',
      location: {
        coordinates: [37.7840, -122.4200],
        address: 'Van Ness Ave northbound near Geary',
        heading: 350,
        speedKmh: 56,
      },
      assignedIncidentId: 'INC-2026-0002',
      paramedicCrew: [
        { name: 'Rachel Torres', role: 'Senior Paramedic', certification: 'NRP / Critical Care' },
        { name: 'James Wilson', role: 'Paramedic / Driver', certification: 'EVOC / EMT-P' },
      ],
      equipment: [
        'Philips Tempus Pro Monitor',
        'LUCAS 3 Chest Compression System',
        'Butterfly iQ+ Ultrasound',
      ],
      fuelLevel: 78,
      batteryLevel: 91,
      baseStation: 'Station 3 West Sector',
      isSimulated: false,
    },
    {
      vehicleId: 'AMB-104',
      callsign: 'Swift-Bravo',
      type: 'RAPID_RESPONSE',
      status: 'AVAILABLE',
      location: {
        coordinates: [37.7950, -122.4020],
        address: 'Financial District Standby Bay',
        heading: 90,
        speedKmh: 0,
      },
      paramedicCrew: [
        { name: 'Liam O’Connor', role: 'Solo Response Paramedic', certification: 'Tactical Paramedic (TP-C)' },
      ],
      equipment: [
        'Zoll AED 3 BLS/ALS Defibrillator',
        'Advanced Airway Trauma Kit',
        'EZ-IO Intraosseous Infusion Drill',
      ],
      fuelLevel: 96,
      batteryLevel: 100,
      baseStation: 'Station 2 North Pier',
      isSimulated: false,
    },
    {
      vehicleId: 'AMB-105',
      callsign: 'Medic-Phoenix',
      type: 'BASIC_LIFE_SUPPORT',
      status: 'AVAILABLE',
      location: {
        coordinates: [37.7580, -122.4350],
        address: 'Castro & Market Corridor',
        heading: 270,
        speedKmh: 0,
      },
      paramedicCrew: [
        { name: 'Maya Lin', role: 'Lead EMT', certification: 'NREMT Advanced' },
        { name: 'Noah Patel', role: 'Emergency Medical Technician', certification: 'NREMT Basic' },
      ],
      equipment: [
        'Stryker Power-PRO XT Cot',
        'AED Plus Defibrillator',
        'Suction & Oxygen Resuscitation Kit',
      ],
      fuelLevel: 82,
      batteryLevel: 89,
      baseStation: 'Station 5 Twin Peaks',
      isSimulated: false,
    },
    {
      vehicleId: 'AMB-106',
      callsign: 'Aero-Sentinel',
      type: 'ADVANCED_LIFE_SUPPORT',
      status: 'AT_SCENE',
      location: {
        coordinates: [37.7815, -122.3920],
        address: 'Embarcadero Pier 28 Staging',
        heading: 120,
        speedKmh: 0,
      },
      assignedIncidentId: 'INC-2026-0001',
      paramedicCrew: [
        { name: 'Zack Taylor', role: 'Field Medic', certification: 'NRP / PHTLS' },
        { name: 'Chloe Kim', role: 'Field Medic', certification: 'NRP / ACLS' },
      ],
      equipment: [
        'Zoll X Series Defibrillator',
        'GlideScope Go Video Laryngoscope',
      ],
      fuelLevel: 71,
      batteryLevel: 85,
      baseStation: 'Station 2 North Pier',
      isSimulated: false,
    },
  ]);

  console.log('[Seed] 🚨 Seeding Incidents...');
  const now = Date.now();
  const incidents = await Incident.insertMany([
    {
      incidentId: 'INC-2026-0001',
      title: 'High-Impact Vehicle Collision on Embarcadero',
      category: 'TRAFFIC_COLLISION',
      description: 'Two passenger vehicles collided at 55 mph intersection. One vehicle on its side with driver pinned. Debris across multiple traffic lanes.',
      severity: 'CRITICAL',
      priorityScore: 94,
      status: 'ON_SCENE',
      location: {
        address: 'Embarcadero & Harrison St (Pier 28 intersection)',
        coordinates: [37.7895, -122.3892],
        district: 'Waterfront Corridor',
      },
      source: 'CCTV_AI',
      callerInfo: { name: 'Automated Caltrans AI Camera #42', phone: 'Automated Sensor Feed' },
      assignedAmbulanceId: 'AMB-106',
      assignedAmbulanceCallsign: 'Aero-Sentinel',
      recommendedHospitalId: 'HOSP-01',
      recommendedHospitalName: 'Metro General Trauma & Surgical Institute',
      routeData: {
        waypoints: [[37.7815, -122.3920], [37.7850, -122.3905], [37.7895, -122.3892]],
        distanceKm: 1.8,
        etaMinutes: 3,
      },
      aiTriage: {
        summary: 'High kinetics collision with active entrapment detected via camera stream and rapid telematics ping.',
        confidence: 96,
        factors: [
          'High delta-V impact exceeding 40 mph threshold',
          'Driver entrapment requiring hydraulic extrication tools',
          'Potential thoracic and neurological trauma',
        ],
        clinicalRecommendation: 'Dispatch ALS unit with extrication assist. Prepare Level 1 Trauma Resuscitation Bay at Metro General Institute.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 14 * 60000), actor: 'CCTV Vision AI', note: 'Impact detected on camera #42' },
        { stage: 'AI_TRIAGED', timestamp: new Date(now - 13.5 * 60000), actor: 'Severity Agent', note: 'Classified CRITICAL (Score 94)' },
        { stage: 'DISPATCHED', timestamp: new Date(now - 13 * 60000), actor: 'Dispatcher Delta-7', note: 'Dispatched Aero-Sentinel' },
        { stage: 'EN_ROUTE', timestamp: new Date(now - 12 * 60000), actor: 'Aero-Sentinel', note: 'Unit rolled with lights & sirens' },
        { stage: 'ON_SCENE', timestamp: new Date(now - 7 * 60000), actor: 'Paramedic Zack Taylor', note: 'Arrived on scene, patient extrication underway' },
      ],
      timestamps: {
        reportedAt: new Date(now - 14 * 60000),
        triagedAt: new Date(now - 13.5 * 60000),
        dispatchedAt: new Date(now - 13 * 60000),
        enRouteAt: new Date(now - 12 * 60000),
        arrivedAt: new Date(now - 7 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
    {
      incidentId: 'INC-2026-0002',
      title: 'Acute Cerebrovascular Event (Suspected Stroke)',
      category: 'STROKE_NEURO',
      description: '68yo male patient experiencing sudden onset right-sided hemiparesis and expressive aphasia. Last known well: 22 minutes ago.',
      severity: 'HIGH',
      priorityScore: 88,
      status: 'EN_ROUTE',
      location: {
        address: '1420 Sutter St, Apt 4B',
        coordinates: [37.7876, -122.4235],
        district: 'Lower Pacific Heights',
      },
      source: '911_VOICE',
      callerInfo: { name: 'Martha Stewart (Spouse)', phone: '+1 (415) 555-8912' },
      assignedAmbulanceId: 'AMB-103',
      assignedAmbulanceCallsign: 'Life-Echo',
      recommendedHospitalId: 'HOSP-02',
      recommendedHospitalName: 'UCSF Medical Center & Cardiovascular Care',
      routeData: {
        waypoints: [[37.7840, -122.4200], [37.7860, -122.4220], [37.7876, -122.4235]],
        distanceKm: 2.1,
        etaMinutes: 4,
      },
      aiTriage: {
        summary: 'Golden Window Stroke presentation (< 4.5 hour tPA/thrombectomy eligibility window active).',
        confidence: 94,
        factors: [
          'Acute onset focal neurological deficits (FAST positive)',
          'High probability large vessel occlusion (LVO)',
          'Time-sensitive reperfusion candidate',
        ],
        clinicalRecommendation: 'Direct routing to UCSF Comprehensive Stroke Center. Pre-notify neuro-interventional team for CT perfusion prep.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 8 * 60000), actor: '911 Operator Ingestion', note: 'Emergency call from spouse' },
        { stage: 'AI_TRIAGED', timestamp: new Date(now - 7.5 * 60000), actor: 'AI Engine', note: 'Severity assigned: HIGH' },
        { stage: 'DISPATCHED', timestamp: new Date(now - 7 * 60000), actor: 'Dispatcher Delta-7', note: 'Life-Echo assigned' },
        { stage: 'EN_ROUTE', timestamp: new Date(now - 6 * 60000), actor: 'Life-Echo Crew', note: 'En route, ETA 4 min' },
      ],
      timestamps: {
        reportedAt: new Date(now - 8 * 60000),
        triagedAt: new Date(now - 7.5 * 60000),
        dispatchedAt: new Date(now - 7 * 60000),
        enRouteAt: new Date(now - 6 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
    {
      incidentId: 'INC-2026-0003',
      title: 'Sudden Cardiac Arrest in Transit Station',
      category: 'CARDIAC_ARREST',
      description: '54yo female collapsed on platform. Bystander initiated chest compressions. Public AED brought to scene, shocking rhythm detected.',
      severity: 'CRITICAL',
      priorityScore: 98,
      status: 'REPORTED',
      location: {
        address: 'Civic Center Transit Concourse (Level 2)',
        coordinates: [37.7797, -122.4138],
        district: 'Civic Center',
      },
      source: 'CITIZEN_MOBILE',
      callerInfo: { name: 'Station Attendant Marcus Lee', phone: '+1 (415) 555-3004' },
      assignedAmbulanceId: null, // Awaiting immediate operator dispatch
      recommendedHospitalId: 'HOSP-01',
      recommendedHospitalName: 'Metro General Trauma & Surgical Institute',
      routeData: {
        waypoints: [[37.7785, -122.4120], [37.7797, -122.4138]],
        distanceKm: 0.6,
        etaMinutes: 2,
      },
      aiTriage: {
        summary: 'Imminent cardiac death event. Ventricular fibrillation detected by onsite AED.',
        confidence: 99,
        factors: [
          'Immediate pulseless arrest state',
          'Shockable rhythm (VF/VT) confirmed by public AED',
          'Every minute without ROSC reduces survival by 7-10%',
        ],
        clinicalRecommendation: 'Immediate priority dispatch of closest ALS or Mobile ICU unit (Guardian-Alpha or Rescue-Titan). Alert Cath Lab.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 2 * 60000), actor: 'Citizen App Beacon', note: 'Bystander activated SOS alert with AED telemetry' },
        { stage: 'AI_TRIAGED', timestamp: new Date(now - 1.8 * 60000), actor: 'AI Engine', note: 'CRITICAL priority triggered. Audio alert dispatched.' },
      ],
      timestamps: {
        reportedAt: new Date(now - 2 * 60000),
        triagedAt: new Date(now - 1.8 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
    {
      incidentId: 'INC-2026-0004',
      title: 'Industrial Chemical Flash Fire & Inhalation',
      category: 'INDUSTRIAL_FIRE',
      description: 'Flash fire in chemical storage facility. Two workers with superficial flash burns and respiratory irritant exposure. Sprinklers active.',
      severity: 'HIGH',
      priorityScore: 78,
      status: 'REPORTED',
      location: {
        address: '2200 Jerrold Ave, Building C',
        coordinates: [37.7445, -122.3980],
        district: 'Bayview Industrial Sector',
      },
      source: 'IOT_SENSOR',
      callerInfo: { name: 'Facility Smoke & Thermal Node #12', phone: 'Direct Telemetry Gateway' },
      assignedAmbulanceId: null,
      recommendedHospitalId: 'HOSP-03',
      recommendedHospitalName: 'St. Francis Regional Memorial & Burn Center',
      aiTriage: {
        summary: 'Thermal explosion with chemical inhalation hazard. Specialty burn care protocol recommended.',
        confidence: 91,
        factors: ['Hazardous chemical atmosphere', 'Multiple thermal burn casualties', 'Airway thermal injury potential'],
        clinicalRecommendation: 'Dispatch ALS unit with cyanide antidote kit. Direct patient transport to Bothin Burn Center.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 4 * 60000), actor: 'Facility IoT Gateway', note: 'Heat threshold exceeded 350F' },
      ],
      timestamps: {
        reportedAt: new Date(now - 4 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
    {
      incidentId: 'INC-2026-0005',
      title: 'Pediatric Respiratory Distress & Stridor',
      category: 'RESPIRATORY_DISTRESS',
      description: '3yo female with acute barking cough, severe inspiratory stridor, and intercostal retractions. Oxygen saturation 91% on room air.',
      severity: 'MEDIUM',
      priorityScore: 62,
      status: 'REPORTED',
      location: {
        address: '550 14th St, Unit 201',
        coordinates: [37.7682, -122.4270],
        district: 'Mission District',
      },
      source: '911_VOICE',
      callerInfo: { name: 'Jennifer Lopez (Parent)', phone: '+1 (415) 555-4921' },
      assignedAmbulanceId: null,
      recommendedHospitalId: 'HOSP-02',
      recommendedHospitalName: 'UCSF Medical Center & Cardiovascular Care',
      aiTriage: {
        summary: 'Severe croup vs foreign body aspiration in toddler with compromised work of breathing.',
        confidence: 89,
        factors: ['Pediatric airway anatomy vulnerability', 'Inspiratory stridor and retractions present', 'Desaturating'],
        clinicalRecommendation: 'BLS or ALS response with racemic epinephrine and humidified oxygen.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 18 * 60000), actor: '911 Operator', note: 'Call received from mother' },
      ],
      timestamps: {
        reportedAt: new Date(now - 18 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
    {
      incidentId: 'INC-2026-0006',
      title: 'Fall from Scaffolding with Lower Extremity Fracture',
      category: 'FALL_INJURY',
      description: '40yo construction worker fell approx 10 feet. Closed deformity to right lower leg. Alert and oriented, no loss of consciousness.',
      severity: 'LOW',
      priorityScore: 32,
      status: 'RESOLVED',
      location: {
        address: '350 Mission St (Jobsite 4)',
        coordinates: [37.7915, -122.3975],
        district: 'South of Market (SOMA)',
      },
      source: 'OPERATOR_MANUAL',
      callerInfo: { name: 'Site Safety Officer Frank Miller', phone: '+1 (415) 555-7119' },
      assignedAmbulanceId: 'AMB-105',
      assignedAmbulanceCallsign: 'Medic-Phoenix',
      recommendedHospitalId: 'HOSP-01',
      recommendedHospitalName: 'Metro General Trauma & Surgical Institute',
      aiTriage: {
        summary: 'Non-life-threatening musculoskeletal injury. Hemodynamically stable.',
        confidence: 97,
        factors: ['Isolated extremity trauma', 'No neurological compromise', 'Normal vitals reported'],
        clinicalRecommendation: 'BLS immobilization and orthopedic triage.',
      },
      timeline: [
        { stage: 'REPORTED', timestamp: new Date(now - 55 * 60000), actor: 'Dispatch Phone', note: 'Call logged' },
        { stage: 'DISPATCHED', timestamp: new Date(now - 54 * 60000), actor: 'Dispatcher Delta-7', note: 'Medic-Phoenix dispatched' },
        { stage: 'ON_SCENE', timestamp: new Date(now - 48 * 60000), actor: 'Medic-Phoenix', note: 'Splinting applied' },
        { stage: 'RESOLVED', timestamp: new Date(now - 15 * 60000), actor: 'Metro General ED', note: 'Handover complete, patient admitted' },
      ],
      timestamps: {
        reportedAt: new Date(now - 55 * 60000),
        dispatchedAt: new Date(now - 54 * 60000),
        arrivedAt: new Date(now - 48 * 60000),
        resolvedAt: new Date(now - 15 * 60000),
      },
      dataSource: 'STORED_DATABASE',
      isSimulated: false,
    },
  ]);

  console.log('[Seed] 📝 Seeding Initial Audit Logs...');
  await AuditLog.insertMany([
    {
      operator: { name: 'System Bootstrapper', role: 'Telemetry Root', badgeId: 'SYS-001' },
      action: 'SYSTEM_INITIALIZED',
      targetEntity: { entityType: 'SYSTEM_CONFIG', entityId: 'SYS-CORE' },
      details: { environment: 'Production Command Center', seedVersion: '2.5.0' },
      severity: 'INFO',
    },
    {
      operator: { name: 'Dispatcher Delta-7', role: 'Level 3 Commander', badgeId: 'GR-8802' },
      action: 'AMBULANCE_DISPATCHED',
      incidentId: 'INC-2026-0001',
      targetEntity: { entityType: 'AMBULANCE', entityId: 'AMB-106' },
      details: { note: 'Aero-Sentinel dispatched to Pier 28 Collision' },
      severity: 'CRITICAL_DISPATCH',
    },
    {
      operator: { name: 'Dispatcher Delta-7', role: 'Level 3 Commander', badgeId: 'GR-8802' },
      action: 'AMBULANCE_DISPATCHED',
      incidentId: 'INC-2026-0002',
      targetEntity: { entityType: 'AMBULANCE', entityId: 'AMB-103' },
      details: { note: 'Life-Echo dispatched to Sutter St Stroke event' },
      severity: 'CRITICAL_DISPATCH',
    },
  ]);

  console.log(`[Seed] ✅ Seed successful: ${incidents.length} incidents, ${ambulances.length} ambulances, ${hospitals.length} hospitals.`);
  return {
    incidentsCount: incidents.length,
    ambulancesCount: ambulances.length,
    hospitalsCount: hospitals.length,
  };
};

// If run directly via command line
if (process.argv[1]?.endsWith('seedData.js')) {
  try {
    await connectDB();
    await seedInitialData();
    await mongoose.disconnect();
    console.log('[Seed] Database disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during manual seed:', err);
    process.exit(1);
  }
}
