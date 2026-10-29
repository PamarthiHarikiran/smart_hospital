const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const { io: ioClient } = require(path.join(__dirname, '../../frontend/node_modules/socket.io-client'));
const app = require('../app');
const { connectDB, closeDB } = require('../config/db');
const { initSocketServer } = require('../socket/socketHandler');
const seedData = require('../utils/seedDatabase');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const EmergencyAlert = require('../models/EmergencyAlert');
const jwt = require('jsonwebtoken');

const PORT = 5566;

async function runTests() {
  console.log('=== STARTING EMERGENCY CHATBOX & REAL-TIME ALERTS INTEGRATION TEST ===\n');

  let server;
  let ioServer;
  let patientToken, doctorToken, adminToken, patient2Token;
  let patientUser, doctorUser, adminUser, patient2User;
  let testConversation;

  try {
    await connectDB();
    await seedData(false);

    server = http.createServer(app);
    ioServer = initSocketServer(server);

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on http://localhost:${PORT}`);

    // Retrieve test users
    patientUser = await User.findOne({ email: 'patient.john@gmail.com' });
    doctorUser = await User.findOne({ email: 'doctor.sarah@gmail.com' });
    adminUser = await User.findOne({ email: 'admin.elitecare@gmail.com' });
    patient2User = await User.findOne({ email: 'patient.mary@gmail.com' });

    if (!patientUser || !doctorUser || !adminUser) {
      throw new Error('Seed users not found');
    }

    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_hospital_management_2026';
    patientToken = jwt.sign({ id: patientUser._id, role: patientUser.role }, secret, { expiresIn: '1d' });
    doctorToken = jwt.sign({ id: doctorUser._id, role: doctorUser.role }, secret, { expiresIn: '1d' });
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1d' });
    patient2Token = jwt.sign({ id: patient2User._id, role: patient2User.role }, secret, { expiresIn: '1d' });

    console.log('Test JWT tokens generated for Patient, Doctor, and Admin.\n');

    // TEST 1: Patient retrieves conversations
    console.log('--- TEST 1: REST API - Patient gets conversations ---');
    const convRes = await makeRequest({
      path: '/api/chat/conversations',
      method: 'GET',
      token: patientToken,
    });
    assert(convRes.statusCode === 200, 'Expected 200 for getConversations');
    assert(convRes.body.success === true, 'Expected success true');
    assert(Array.isArray(convRes.body.data), 'Expected data to be an array');
    console.log(`✓ Patient retrieved ${convRes.body.data.length} conversation(s) successfully.\n`);

    testConversation = convRes.body.data[0];

    // TEST 2: Patient gets authorized doctors list
    console.log('--- TEST 2: REST API - Patient gets authorized doctors ---');
    const docRes = await makeRequest({
      path: '/api/chat/doctors',
      method: 'GET',
      token: patientToken,
    });
    assert(docRes.statusCode === 200, 'Expected 200 for getAuthorizedDoctors');
    assert(docRes.body.data.length >= 5, 'Expected at least 5 doctors');
    console.log(`✓ Patient retrieved ${docRes.body.data.length} available hospital physician(s).\n`);

    // TEST 3: Patient gets message history
    console.log('--- TEST 3: REST API - Patient gets messages ---');
    const msgRes = await makeRequest({
      path: `/api/chat/conversations/${testConversation._id}/messages`,
      method: 'GET',
      token: patientToken,
    });
    assert(msgRes.statusCode === 200, 'Expected 200 for getMessages');
    assert(Array.isArray(msgRes.body.data), 'Expected array of messages');
    console.log(`✓ Retrieved ${msgRes.body.data.length} messages in conversation.\n`);

    // TEST 4: Unauthorized user tries to access another patient's messages
    console.log('--- TEST 4: SECURITY - Unauthorized patient denied conversation access ---');
    const unauthRes = await makeRequest({
      path: `/api/chat/conversations/${testConversation._id}/messages`,
      method: 'GET',
      token: patient2Token,
    });
    assert(unauthRes.statusCode === 403, `Expected 403 Forbidden, got ${unauthRes.statusCode}`);
    console.log('✓ Access correctly blocked with 403 Forbidden for unauthorized user.\n');

    // TEST 5: Patient sends message with deduplication check
    console.log('--- TEST 5: REST API - Patient sends message with clientTempId deduplication ---');
    const tempId = `temp_unit_test_${Date.now()}`;
    const sendRes1 = await makeRequest({
      path: `/api/chat/conversations/${testConversation._id}/messages`,
      method: 'POST',
      token: patientToken,
      body: { content: 'Automated test message for Dr. Sarah', clientTempId: tempId },
    });
    assert(sendRes1.statusCode === 201, 'Expected 201 Created');
    assert(sendRes1.body.data.content === 'Automated test message for Dr. Sarah');

    // Retry sending exact same tempId -> should deduplicate
    const sendRes2 = await makeRequest({
      path: `/api/chat/conversations/${testConversation._id}/messages`,
      method: 'POST',
      token: patientToken,
      body: { content: 'Automated test message for Dr. Sarah', clientTempId: tempId },
    });
    assert(sendRes2.statusCode === 200, 'Expected 200 for deduplicated request');
    assert(sendRes2.body.message.includes('deduplicated'), 'Expected deduplication message');
    console.log('✓ Message created and deduplication verified.\n');

    // TEST 6: Patient triggers Emergency Alert
    console.log('--- TEST 6: EMERGENCY ALERT - Patient triggers critical alert ---');
    const alertRes = await makeRequest({
      path: '/api/emergency-alerts',
      method: 'POST',
      token: patientToken,
      body: {
        doctorId: doctorUser._id,
        conversationId: testConversation._id,
        description: 'Test emergency: High cardiac palpitations and dizziness',
        symptoms: 'Palpitations, pre-syncope',
        priority: 'CRITICAL',
      },
    });
    assert(alertRes.statusCode === 201, 'Expected 201 Created');
    assert(alertRes.body.disclaimer.includes('For life-threatening emergencies'), 'Expected disclaimer in response');
    const createdAlert = alertRes.body.data;
    assert(createdAlert.status === 'PENDING', 'Expected status to be PENDING');
    console.log(`✓ Emergency alert created with ID: ${createdAlert._id} & mandatory disclaimer confirmed.\n`);

    // TEST 7: Patient cannot acknowledge emergency alert (Staff only)
    console.log('--- TEST 7: SECURITY - Patient cannot acknowledge emergency alerts ---');
    const patientAckRes = await makeRequest({
      path: `/api/emergency-alerts/${createdAlert._id}/acknowledge`,
      method: 'PATCH',
      token: patientToken,
      body: { note: 'Trying to self acknowledge' },
    });
    assert(patientAckRes.statusCode === 403, `Expected 403 Forbidden, got ${patientAckRes.statusCode}`);
    console.log('✓ Non-staff patient blocked from acknowledging alerts with 403 Forbidden.\n');

    // TEST 8: Doctor acknowledges emergency alert
    console.log('--- TEST 8: EMERGENCY ALERT - Doctor acknowledges emergency alert ---');
    const docAckRes = await makeRequest({
      path: `/api/emergency-alerts/${createdAlert._id}/acknowledge`,
      method: 'PATCH',
      token: doctorToken,
      body: { note: 'Dr. Sarah Jenkins received alert. ER team alerted.' },
    });
    assert(docAckRes.statusCode === 200, 'Expected 200 OK');
    assert(docAckRes.body.data.status === 'ACKNOWLEDGED', 'Expected status ACKNOWLEDGED');
    assert(docAckRes.body.data.acknowledgedBy.name.includes('Sarah'), 'Expected acknowledgedBy doctor name');
    console.log('✓ Alert successfully acknowledged by doctor with audit trail recorded.\n');

    // TEST 9: Admin resolves emergency alert
    console.log('--- TEST 9: EMERGENCY ALERT - Admin resolves emergency alert ---');
    const adminRes = await makeRequest({
      path: `/api/emergency-alerts/${createdAlert._id}/resolve`,
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Patient attended in ER room 4. Condition stabilized.' },
    });
    assert(adminRes.statusCode === 200, 'Expected 200 OK');
    assert(adminRes.body.data.status === 'RESOLVED', 'Expected status RESOLVED');
    console.log('✓ Emergency alert successfully resolved and closed.\n');

    // TEST 10: REAL-TIME Socket.IO E2E Integration
    console.log('--- TEST 10: REAL-TIME SOCKET.IO - End-to-End messaging and alert events ---');

    // Connect patient socket
    const patientSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: patientToken },
      transports: ['websocket'],
    });

    // Connect doctor socket
    const doctorSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: doctorToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => patientSocket.on('connect', resolve)),
      new Promise((resolve) => doctorSocket.on('connect', resolve)),
    ]);
    console.log('✓ Patient and Doctor sockets connected and authenticated via JWT.');

    // Join conversation room
    await new Promise((resolve) => {
      doctorSocket.emit('join_conversation', { conversationId: testConversation._id }, (res) => {
        assert(res.success === true, 'Doctor failed to join room');
        resolve();
      });
    });

    // Send real-time message from patient to doctor via socket
    const receivedMessagePromise = new Promise((resolve) => {
      doctorSocket.on('new_message', (msg) => {
        resolve(msg);
      });
    });

    patientSocket.emit('send_message', {
      conversationId: testConversation._id,
      content: 'Real-time test message via Socket.IO!',
      messageType: 'TEXT',
    });

    const receivedMessage = await receivedMessagePromise;
    assert(receivedMessage.content === 'Real-time test message via Socket.IO!', 'Message content mismatch');
    console.log('✓ Real-time message successfully transmitted across Socket.IO rooms.');

    // Doctor receives emergency alert real-time
    const alertReceivedPromise = new Promise((resolve) => {
      doctorSocket.on('emergency_alert_received', (alt) => {
        resolve(alt);
      });
    });

    patientSocket.emit('trigger_emergency_alert', {
      doctorId: doctorUser._id,
      description: 'Socket.io real-time emergency alert test',
      priority: 'CRITICAL',
    });

    const rtAlert = await alertReceivedPromise;
    assert(rtAlert.description === 'Socket.io real-time emergency alert test', 'Alert description mismatch');
    console.log('✓ Real-time emergency alert successfully received by doctor socket.');

    patientSocket.disconnect();
    doctorSocket.disconnect();

    console.log('\n>>> ALL 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY! <<<');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
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
