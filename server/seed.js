const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb://localhost:27017/health';

// Import local models (copied here for the script)
const PatientSchema = new mongoose.Schema({
  patientId: String,
  qrToken: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  bloodType: String,
  dob: String,
  address: String,
  status: String,
  slot: String, // Added slot for doctor dashboard integration
  reports: Array,
  history: Array
});
const Patient = mongoose.model('Patient', PatientSchema);

const initialPatients = [
  {
    patientId: 'PAT-001',
    qrToken: 'HTL-DEMO-V1',
    name: 'KIRAN',
    phone: '+91 98480 22338',
    email: 'kiran@healthlock.io',
    bloodType: 'B+',
    dob: '14 Aug 1998',
    address: 'Whitefield, Bangalore',
    status: 'Pending',
    slot: '10:30 AM',
    reports: [
      { name: 'Blood_Report_Jan.pdf', url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', date: new Date() }
    ],
    history: [
      { date: '2025-12-10', purpose: 'General Checkup', location: 'Apollo Hospital', resolution: 'Healthy' }
    ],
    password: 'password123'
  },
  {
    patientId: 'PAT-002',
    qrToken: 'HTL-DEMO-V1',
    name: 'PRIYA',
    phone: '+91 98480 22339',
    status: 'Lab Completed',
    slot: '11:15 AM',
    reports: [
      { name: 'X-Ray_Chest.jpg', url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', date: new Date() }
    ],
    password: 'password123'
  },
  {
    patientId: 'PAT-003',
    qrToken: 'HTL-DEMO-V1',
    name: 'RAMESH',
    phone: '+91 98480 22340',
    status: 'Pending',
    slot: '02:00 PM',
    reports: [],
    password: 'password123'
  },
  {
    patientId: 'PAT-004',
    qrToken: 'HTL-DEMO-V1',
    name: 'SURYA',
    phone: '+91 98480 22341',
    status: 'Lab Assigned',
    slot: '03:30 PM',
    password: 'password123'
  },
  {
    patientId: 'PAT-005',
    qrToken: 'HTL-DEMO-V1',
    name: 'SIRI',
    phone: '+91 98480 22342',
    status: 'Pending',
    slot: '09:45 AM',
    password: 'password123'
  }
];

const initialLogs = [
  { action: 'SYSTEM_BOOT', details: 'Healthcare Blockchain Node #1 Activated', actor: 'Network' },
  { action: 'ADMIN_INIT', details: 'Root Administrator AMBICA session started', actor: 'Admin' }
];

const ActivityLog = mongoose.model('ActivityLog', new mongoose.Schema({ action: String, details: String, actor: String, timestamp: { type: Date, default: Date.now } }));

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Seeding comprehensive data...');
    await Patient.deleteMany({});
    await Patient.insertMany(initialPatients);
    // Only insert initial logs if none exist to preserve user history
    const existingLogs = await ActivityLog.countDocuments();
    if (existingLogs === 0) {
      await ActivityLog.insertMany(initialLogs);
      console.log('✅ Initial logs seeded.');
    } else {
      console.log('ℹ️ Activity logs exist, skipping log seeding to preserve history.');
    }
    console.log('✅ Seeding Complete!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
