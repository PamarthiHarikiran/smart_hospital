const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const { io: ioClient } = require(path.join(__dirname, '../../frontend/node_modules/socket.io-client'));
const app = require('../app');
const { connectDB, closeDB } = require('../config/db');
const { initSocketServer } = require('../socket/socketHandler');
const seedData = require('../utils/seedDatabase');
const User = require('../models/User');
const LabReport = require('../models/LabReport');
const jwt = require('jsonwebtoken');

const PORT = 5577;

async function runTests() {
  console.log('=== STARTING REAL-TIME LABORATORY REPORT INTEGRATION TESTS ===\n');

  let server;
  let ioServer;
  let patientToken, doctorToken, labToken, patient2Token;
  let patientUser, doctorUser, labUser, patient2User;
  let sampleReport;

  try {
    await connectDB();
    await seedData(false);

    server = http.createServer(app);
    ioServer = initSocketServer(server);

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on http://localhost:${PORT}`);

    // Retrieve users
    patientUser = await User.findOne({ email: 'patient.john@gmail.com' });
    doctorUser = await User.findOne({ email: 'doctor.sarah@gmail.com' });
    labUser = await User.findOne({ email: 'lab.elitecare@gmail.com' });
    patient2User = await User.findOne({ email: 'patient.mary@gmail.com' });

    if (!patientUser || !doctorUser || !labUser) {
      throw new Error('Seed users not found');
    }

    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_hospital_management_2026';
    patientToken = jwt.sign({ id: patientUser._id, role: patientUser.role }, secret, { expiresIn: '1d' });
    doctorToken = jwt.sign({ id: doctorUser._id, role: doctorUser.role }, secret, { expiresIn: '1d' });
    labToken = jwt.sign({ id: labUser._id, role: labUser.role }, secret, { expiresIn: '1d' });
    patient2Token = jwt.sign({ id: patient2User._id, role: patient2User.role }, secret, { expiresIn: '1d' });

    console.log('✓ JWT authentication tokens generated.\n');

    // TEST 1: Patient retrieves lab reports list with structured parameters
    console.log('--- TEST 1: REST API - Patient gets diagnostic laboratory reports ---');
    const getRes = await makeRequest({
      path: '/api/lab-reports',
      method: 'GET',
      token: patientToken,
    });
    assert(getRes.statusCode === 200, `Expected 200, got ${getRes.statusCode}`);
    assert(getRes.body.success === true, 'Expected success true');
    assert(Array.isArray(getRes.body.data), 'Expected reports array');
    assert(getRes.body.data.length >= 4, `Expected at least 4 reports for John, got ${getRes.body.data.length}`);

    sampleReport = getRes.body.data[0];
    console.log(`✓ Patient retrieved ${getRes.body.data.length} reports. Sample: "${sampleReport.testName}" (Status: ${sampleReport.requestStatus}).\n`);

    // TEST 2: Verified report contains individual parameters, reference ranges, and abnormal flags
    console.log('--- TEST 2: VERIFICATION - Check report parameters and reference ranges ---');
    const verifiedReport = getRes.body.data.find((r) => r.requestStatus === 'VERIFIED');
    assert(verifiedReport, 'Expected a VERIFIED report in seed data');
    assert(Array.isArray(verifiedReport.parameters), 'Expected parameters array');
    assert(verifiedReport.parameters.length > 0, 'Expected at least one parameter');

    const hbParam = verifiedReport.parameters.find((p) => p.name.includes('Hemoglobin'));
    assert(hbParam, 'Expected Hemoglobin parameter');
    assert(hbParam.unit === 'g/dL', 'Expected g/dL unit');
    assert(hbParam.referenceRange === '13.5 - 17.5', 'Expected reference range');
    assert(hbParam.status === 'NORMAL', 'Expected NORMAL status');
    console.log(`✓ Verified report parameters checked. Hemoglobin: ${hbParam.value} ${hbParam.unit} (Ref: ${hbParam.referenceRange}, Status: ${hbParam.status}).\n`);

    // TEST 3: Doctor orders new diagnostic lab request
    console.log('--- TEST 3: REST API - Doctor requests new lab investigation ---');
    const orderRes = await makeRequest({
      path: '/api/lab-reports',
      method: 'POST',
      token: doctorToken,
      body: {
        patient: patientUser._id,
        testName: 'Serum Ferritin & Iron Studies',
        testCategory: 'Clinical Biochemistry',
        testDescription: 'Evaluation of total iron-binding capacity and iron stores.',
        sampleType: 'Serum (Fasting)',
        price: 40.0,
      },
    });
    assert(orderRes.statusCode === 201, `Expected 201 Created, got ${orderRes.statusCode}`);
    assert(orderRes.body.data.requestStatus === 'REQUESTED', 'Expected initial status REQUESTED');
    const createdReport = orderRes.body.data;
    console.log(`✓ Doctor created new lab request with ID: ${createdReport._id} (Report ID: ${createdReport.reportId}).\n`);

    // TEST 4: Security test - Another patient cannot access this report
    console.log('--- TEST 4: SECURITY - Patient 2 blocked from accessing Patient 1 report ---');
    const unauthRes = await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'GET',
      token: patient2Token,
    });
    assert(unauthRes.statusCode === 403, `Expected 403 Forbidden, got ${unauthRes.statusCode}`);
    console.log('✓ Cross-patient access correctly blocked with 403 Forbidden.\n');

    // TEST 5: Progression 1: SAMPLE_COLLECTED
    console.log('--- TEST 5: REAL-TIME PROGRESSION - Step 2: SAMPLE_COLLECTED ---');
    const step2Res = await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'PUT',
      token: labToken,
      body: {
        requestStatus: 'SAMPLE_COLLECTED',
        sampleCollectedBy: 'Phlebotomist Marcus Bell',
        statusNote: 'Blood specimen drawn at Phlebotomy Station 3.',
      },
    });
    assert(step2Res.statusCode === 200, 'Expected 200 OK');
    assert(step2Res.body.data.requestStatus === 'SAMPLE_COLLECTED', 'Expected SAMPLE_COLLECTED');
    assert(step2Res.body.data.sampleCollectedAt, 'Expected sampleCollectedAt timestamp');
    console.log('✓ Report transitioned to SAMPLE_COLLECTED with collection timestamp recorded.\n');

    // TEST 6: Progression 2: PROCESSING
    console.log('--- TEST 6: REAL-TIME PROGRESSION - Step 3: PROCESSING ---');
    const step3Res = await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'PUT',
      token: labToken,
      body: {
        requestStatus: 'PROCESSING',
        statusNote: 'Serum separated and placed in automated analyzer.',
      },
    });
    assert(step3Res.statusCode === 200, 'Expected 200 OK');
    assert(step3Res.body.data.requestStatus === 'PROCESSING', 'Expected PROCESSING');
    assert(step3Res.body.data.processingStartedAt, 'Expected processingStartedAt timestamp');
    console.log('✓ Report transitioned to PROCESSING with analyzer timestamp recorded.\n');

    // TEST 7: Progression 3: COMPLETED with parameters and abnormal flag
    console.log('--- TEST 7: REAL-TIME PROGRESSION - Step 4: COMPLETED with parameters ---');
    const step4Res = await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'PUT',
      token: labToken,
      body: {
        requestStatus: 'COMPLETED',
        parameters: [
          { name: 'Serum Ferritin', value: '385.0', unit: 'ng/mL', referenceRange: '30 - 300', status: 'HIGH', interpretation: 'Elevated iron stores.' },
          { name: 'Serum Iron', value: '115', unit: 'mcg/dL', referenceRange: '60 - 170', status: 'NORMAL', interpretation: 'Normal circulating iron.' },
          { name: 'Total Iron Binding Capacity (TIBC)', value: '320', unit: 'mcg/dL', referenceRange: '240 - 450', status: 'NORMAL' },
          { name: 'Transferrin Saturation', value: '35.9', unit: '%', referenceRange: '20.0 - 50.0', status: 'NORMAL' },
        ],
        result: 'Elevated Serum Ferritin. Normal circulating transferrin saturation.',
        remarks: 'Suggest evaluation for secondary hyperferritinemia or acute phase reaction.',
        statusNote: 'Assay finalized and QC verified.',
      },
    });
    assert(step4Res.statusCode === 200, 'Expected 200 OK');
    assert(step4Res.body.data.requestStatus === 'COMPLETED', 'Expected COMPLETED');
    assert(step4Res.body.data.parameters.length === 4, 'Expected 4 parameters');
    const highParam = step4Res.body.data.parameters.find((p) => p.status === 'HIGH');
    assert(highParam, 'Expected HIGH abnormal status parameter');
    console.log(`✓ Report transitioned to COMPLETED with 4 parameters. Detected abnormal flag: ${highParam.name} = ${highParam.value} ${highParam.unit} (${highParam.status}).\n`);

    // TEST 8: Progression 4: VERIFIED with Pathologist sign-off
    console.log('--- TEST 8: REAL-TIME PROGRESSION - Step 5: VERIFIED with Pathologist sign-off ---');
    const step5Res = await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'PUT',
      token: labToken,
      body: {
        requestStatus: 'VERIFIED',
        verifiedBy: {
          name: 'Dr. Arthur Conan, MD, FACP',
          designation: 'Chief Consultant Pathologist',
          licenseNumber: 'MED-PATH-88492',
          verifiedAt: new Date(),
        },
        statusNote: 'Authorized and digitally signed by Chief Pathologist.',
      },
    });
    assert(step5Res.statusCode === 200, 'Expected 200 OK');
    assert(step5Res.body.data.requestStatus === 'VERIFIED', 'Expected VERIFIED');
    assert(step5Res.body.data.verifiedBy.name.includes('Arthur'), 'Expected pathologist name');
    assert(step5Res.body.data.statusHistory.length >= 5, 'Expected 5 status history entries');
    console.log(`✓ Report officially VERIFIED. Status history audit count: ${step5Res.body.data.statusHistory.length}.\n`);

    // TEST 9: Real-time Socket.IO events end-to-end
    console.log('--- TEST 9: REAL-TIME SOCKET.IO - Room subscription and live telemetry broadcast ---');

    const patientSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: patientToken },
      transports: ['websocket'],
    });

    const doctorSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: doctorToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((res) => patientSocket.on('connect', res)),
      new Promise((res) => doctorSocket.on('connect', res)),
    ]);
    console.log('✓ Patient and Doctor sockets connected and authenticated.');

    // Patient joins specific report room
    await new Promise((res) => {
      patientSocket.emit('join_lab_report', { reportId: createdReport._id }, (ack) => {
        assert(ack.success === true, 'Failed to join report room');
        res();
      });
    });
    console.log(`✓ Patient joined Socket.IO room "lab_report:${createdReport._id}".`);

    // Set up listeners for real-time broadcast
    const patientReceivedPromise = new Promise((res) => {
      patientSocket.on('lab_report_updated', (rep) => {
        res(rep);
      });
    });

    const doctorStatusPromise = new Promise((res) => {
      doctorSocket.on('lab_report_status_changed', (evt) => {
        if (evt.reportId.toString() === createdReport._id.toString()) {
          res(evt);
        }
      });
    });

    // Lab staff updates the remarks
    await makeRequest({
      path: `/api/lab-reports/${createdReport._id}`,
      method: 'PUT',
      token: labToken,
      body: {
        remarks: 'Live real-time socket test update by laboratory staff.',
        statusNote: 'Live test update note.',
      },
    });

    const [patientEvent, doctorEvent] = await Promise.all([
      patientReceivedPromise,
      doctorStatusPromise,
    ]);

    assert(patientEvent.remarks === 'Live real-time socket test update by laboratory staff.', 'Remarks mismatch in socket update');
    assert(doctorEvent.requestStatus === 'VERIFIED', 'Doctor status event mismatch');
    console.log('✓ Patient received live "lab_report_updated" event over Socket.IO room.');
    console.log('✓ Doctor received live "lab_report_status_changed" event over personal room.');

    patientSocket.disconnect();
    doctorSocket.disconnect();

    console.log('\n>>> ALL 9 REAL-TIME LABORATORY INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await closeDB();
  }
}

function makeRequest({ path, method, token, body }) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

runTests();
