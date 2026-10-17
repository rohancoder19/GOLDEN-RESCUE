import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';

dotenv.config();

test('Dispatch Concurrency & State Machine Suite', async (t) => {
  await connectDB();

  // Unique test IDs to avoid interfering with seed data
  const testVehicleId = `AMB-TEST-${Date.now()}`;
  const testIncident1 = `INC-CONC-1-${Date.now()}`;
  const testIncident2 = `INC-CONC-2-${Date.now()}`;

  // Create test ambulance in AVAILABLE state
  await Ambulance.create({
    vehicleId: testVehicleId,
    callsign: 'Test-Unit-99',
    type: 'ADVANCED_LIFE_SUPPORT',
    status: 'AVAILABLE',
    location: {
      coordinates: [37.7749, -122.4194],
      address: 'Test Standby Bay',
      heading: 0,
      speedKmh: 0,
    },
  });

  // Create two separate test incidents
  await Incident.create([
    {
      incidentId: testIncident1,
      title: 'Concurrent Test Incident Alpha',
      category: 'TRAFFIC_COLLISION',
      description: 'Test payload 1 for concurrency check',
      severity: 'CRITICAL',
      status: 'REPORTED',
      location: { address: '100 Test St', coordinates: [37.77, -122.41] },
      dataSource: 'SIMULATED_DEMO',
      isSimulated: true,
    },
    {
      incidentId: testIncident2,
      title: 'Concurrent Test Incident Beta',
      category: 'CARDIAC_ARREST',
      description: 'Test payload 2 for concurrency check',
      severity: 'CRITICAL',
      status: 'REPORTED',
      location: { address: '200 Test St', coordinates: [37.78, -122.42] },
      dataSource: 'SIMULATED_DEMO',
      isSimulated: true,
    },
  ]);

  await t.test('Prevents race condition: only one concurrent dispatch succeeds for same unit', async () => {
    // Simulate atomic acquisition function used in POST /api/incidents/:id/dispatch
    const attemptAtomicDispatch = async (incidentId, vehicleId) => {
      const ambulance = await Ambulance.findOneAndUpdate(
        {
          vehicleId,
          $or: [{ status: 'AVAILABLE' }, { assignedIncidentId: incidentId }],
        },
        {
          $set: {
            status: 'EN_ROUTE',
            assignedIncidentId: incidentId,
            speedKmh: 58,
          },
        },
        { new: true }
      );
      return ambulance;
    };

    // Run both dispatches in parallel
    const [res1, res2] = await Promise.all([
      attemptAtomicDispatch(testIncident1, testVehicleId),
      attemptAtomicDispatch(testIncident2, testVehicleId),
    ]);

    // Exactly one must succeed and one must be null (conflict)
    const successes = [res1, res2].filter((r) => r !== null);
    const failures = [res1, res2].filter((r) => r === null);

    assert.equal(successes.length, 1, 'Only one concurrent dispatch must acquire the unit');
    assert.equal(failures.length, 1, 'The competing concurrent dispatch must fail/be rejected');

    // Verify unit state in DB
    const finalUnit = await Ambulance.findOne({ vehicleId: testVehicleId });
    assert.equal(finalUnit.status, 'EN_ROUTE');
    assert.ok(
      finalUnit.assignedIncidentId === testIncident1 || finalUnit.assignedIncidentId === testIncident2
    );
  });

  await t.test('Rejects re-dispatching already busy unit to a 3rd incident', async () => {
    const testIncident3 = `INC-CONC-3-${Date.now()}`;
    const result = await Ambulance.findOneAndUpdate(
      {
        vehicleId: testVehicleId,
        $or: [{ status: 'AVAILABLE' }, { assignedIncidentId: testIncident3 }],
      },
      {
        $set: { status: 'EN_ROUTE', assignedIncidentId: testIncident3 },
      },
      { new: true }
    );

    assert.equal(result, null, 'Cannot dispatch a unit that is already busy');
  });

  // Clean up test documents
  await Ambulance.deleteOne({ vehicleId: testVehicleId });
  await Incident.deleteMany({ incidentId: { $in: [testIncident1, testIncident2] } });
  await mongoose.disconnect();
});
