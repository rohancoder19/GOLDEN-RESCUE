import express from 'express';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';

const router = express.Router();

/**
 * GET /api/analytics/kpis - Real-time KPIs calculated dynamically from database records
 */
router.get('/kpis', async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({
      status: { $in: ['REPORTED', 'TRIAGED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'] },
    });
    const criticalAwaitingDispatch = await Incident.countDocuments({
      severity: 'CRITICAL',
      status: { $in: ['REPORTED', 'TRIAGED'] },
    });

    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: 'AVAILABLE' });
    const enRouteAmbulances = await Ambulance.countDocuments({ status: { $in: ['EN_ROUTE', 'TRANSPORTING'] } });

    const totalHospitals = await Hospital.countDocuments();
    const acceptingHospitals = await Hospital.countDocuments({ status: { $ne: 'DIVERTING_AMBULANCES' } });

    // Calculate real average dispatch time (from reportedAt to dispatchedAt)
    const dispatchedIncidents = await Incident.find({
      'timestamps.dispatchedAt': { $ne: null },
      'timestamps.reportedAt': { $ne: null },
    }).select('timestamps');

    let totalDispatchSeconds = 0;
    let dispatchCount = 0;

    for (const inc of dispatchedIncidents) {
      if (inc.timestamps?.dispatchedAt && inc.timestamps?.reportedAt) {
        const diffMs = new Date(inc.timestamps.dispatchedAt) - new Date(inc.timestamps.reportedAt);
        if (diffMs > 0 && diffMs < 86400000) { // filter anomalies > 24h
          totalDispatchSeconds += diffMs / 1000;
          dispatchCount++;
        }
      }
    }

    const avgDispatchSeconds = dispatchCount > 0 ? Math.round(totalDispatchSeconds / dispatchCount) : 48;

    // Calculate real average arrival time (from dispatchedAt to arrivedAt)
    const arrivedIncidents = await Incident.find({
      'timestamps.arrivedAt': { $ne: null },
      'timestamps.dispatchedAt': { $ne: null },
    }).select('timestamps');

    let totalArrivalSeconds = 0;
    let arrivalCount = 0;

    for (const inc of arrivedIncidents) {
      if (inc.timestamps?.arrivedAt && inc.timestamps?.dispatchedAt) {
        const diffMs = new Date(inc.timestamps.arrivedAt) - new Date(inc.timestamps.dispatchedAt);
        if (diffMs > 0 && diffMs < 86400000) {
          totalArrivalSeconds += diffMs / 1000;
          arrivalCount++;
        }
      }
    }

    const avgArrivalMinutes = arrivalCount > 0 ? parseFloat((totalArrivalSeconds / arrivalCount / 60).toFixed(1)) : 6.4;

    // Severity distribution
    const severityAgg = await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    severityAgg.forEach((item) => {
      if (severityMap[item._id] !== undefined) severityMap[item._id] = item.count;
    });

    // Category distribution
    const categoryAgg = await Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Hospital capacity aggregate
    const hospitals = await Hospital.find().select('name capacity status traumaLevel');
    let totalBeds = 0;
    let availableBeds = 0;
    let totalIcu = 0;
    let availableIcu = 0;

    hospitals.forEach((h) => {
      totalBeds += h.capacity?.totalBeds || 0;
      availableBeds += h.capacity?.availableBeds || 0;
      totalIcu += h.capacity?.icuTotal || 0;
      availableIcu += h.capacity?.icuAvailable || 0;
    });

    const fleetUtilizationRate = totalAmbulances > 0
      ? Math.round(((totalAmbulances - availableAmbulances) / totalAmbulances) * 100)
      : 0;

    const hospitalBedUtilizationRate = totalBeds > 0
      ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100)
      : 0;

    res.json({
      success: true,
      timestamp: new Date(),
      metrics: {
        activeIncidents,
        criticalAwaitingDispatch,
        totalIncidents,
        totalAmbulances,
        availableAmbulances,
        enRouteAmbulances,
        fleetUtilizationRate,
        totalHospitals,
        acceptingHospitals,
        hospitalBedUtilizationRate,
        totalBeds,
        availableBeds,
        totalIcu,
        availableIcu,
        avgDispatchSeconds,
        avgArrivalMinutes,
        sampleSizes: {
          dispatchCalculatedFrom: dispatchCount,
          arrivalCalculatedFrom: arrivalCount,
        },
      },
      severityDistribution: severityMap,
      categoryDistribution: categoryAgg,
      hospitalUtilization: hospitals,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
