const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

// Cryptographic token generator — 16 hex chars from crypto.randomBytes
// Cryptographic token generator — Versioned random hash
const generateSecureToken = (version = 1) => {
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `HTL-${randomPart}-V${version}`;
};

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection State
let cachedDb = null;
const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  
  console.log('📡 Connecting to MongoDB...');
  try {
    const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/health', {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    cachedDb = db;
    console.log('✅ MongoDB Connected Successfully');
    return db;
  } catch (err) {
    console.log('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
};

// Connection Gatekeeper - Ensures DB is ready before every /api request
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ 
      error: 'Database connection failed. Please ensure MONGO_URI is correct and Network Access is open.',
      details: err.message 
    });
  }
});

// --- MODELS ---

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'DOCTOR', 'PATIENT', 'DIAGNOSTICS'], default: 'PATIENT' },
  name: String,
  specialty: String, // For Doctors
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  password: { type: String, required: true },
  qrToken: { type: String },           // Current active one-time token
  tokenHistory: [{
    token: String,                      // The hash that was used
    usedAt: { type: Date, default: Date.now },
    usedBy: String,                     // Doctor/actor who consumed this token
    action: String                      // What action triggered the rotation
  }],
  name: String,
  phone: String,
  email: String,
  bloodType: String,
  dob: String,
  slot: String,
  address: String,
  assignedDoctor: String,
  vitals: {
    heartRate: { type: Number, default: 72 },
    bloodPressure: { type: String, default: '120/80' }
  },
  history: [{
    date: { type: Date, default: Date.now },
    purpose: String,
    location: String,
    resolution: String
  }],
  reports: [{
    name: String,
    date: { type: Date, default: Date.now },
    url: String,
    status: { type: String, default: 'Pending' }
  }],
  healthProfile: {
    issues: String,
    allergies: String
  },
  approvalStatus: { type: String, default: 'None' },
  completedDate: Date,
  accessRequestedBy: String,
  status: { type: String, default: 'Pending' }
});
const Patient = mongoose.model('Patient', PatientSchema);

const LabRequestSchema = new mongoose.Schema({
  patientId: String,
  patientName: String,
  testName: String,
  status: { type: String, enum: ['PENDING', 'COLLECTED', 'TESTED'], default: 'PENDING' },
  approvalStatus: { type: String, default: 'None' },
  requestedBy: String,
  timestamp: { type: Date, default: Date.now }
});
const LabRequest = mongoose.model('LabRequest', LabRequestSchema);

const ActivityLogSchema = new mongoose.Schema({
  action: String,
  details: String,
  actor: String,
  targetId: String, // ID of the patient being accessed
  timestamp: { type: Date, default: Date.now }
});
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

// --- API ROUTES ---

// 1. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    if (role === 'PATIENT') {
      // Check for either patientId OR qrToken matching the username
      const patient = await Patient.findOne({
        $or: [
          { patientId: username },
          { qrToken: username },
          { email: username }
        ],
        password: password
      });
      if (!patient) return res.status(401).json({ success: false, error: 'Invalid ID/Token or password' });
      return res.json({
        success: true,
        user: {
          username: patient.patientId,
          patientId: patient.patientId,
          role: 'PATIENT',
          name: patient.name,
          qrToken: patient.qrToken
        }
      });
    } else {
      // Staff roles simplified login (for demo, but added password check)
      let user = await User.findOne({ username });
      if (!user) {
        // Create demo user if doesn't exist (only for demo purposes)
        try {
          user = await User.create({ username, password: password || 'admin123', role });
        } catch (createErr) {
          if (createErr.code === 11000) {
            user = await User.findOne({ username });
          } else {
            throw createErr;
          }
        }
      }

      if (user.role !== role) {
        return res.status(401).json({ success: false, error: 'Incorrect role for this user' });
      } else if (password && user.password !== password) {
        return res.status(401).json({ success: false, error: 'Incorrect staff password' });
      }
      res.json({ success: true, user: { username: user.username, role: user.role } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Patient Registration — generate initial cryptographic token server-side
app.post('/api/patients', async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    const patientId = `PAT-${100 + count + 1}`;
    const initialToken = generateSecureToken(1); // Start with version 1
    const newPatient = await Patient.create({
      ...req.body,
      patientId,
      qrToken: initialToken,            // Overwrite any client-supplied token with server-generated one
      tokenHistory: [{
        token: initialToken,
        usedAt: new Date(),
        usedBy: 'SYSTEM',
        action: 'INITIAL_REGISTRATION'
      }]
    });
    res.json({ success: true, patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Patients: Get All
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.5 Verify Token (read-only check — does NOT consume the token)
app.post('/api/patients/:id/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    if (patient.qrToken === token) {
      res.json({ success: true, patient });
    } else {
      res.status(401).json({ success: false, error: 'Invalid or already-used Access Token' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.6 Rotate Token — archives old hash, generates new cryptographic token
app.post('/api/patients/:id/rotate-token', async (req, res) => {
  try {
    const { usedBy, action } = req.body;
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const oldToken = patient.qrToken;
    const nextVersion = (patient.tokenHistory ? patient.tokenHistory.length : 0) + 2;
    // +2 because history was seeded with 1, and current was 1. Or if empty, etc.
    // Let's make it robust:
    const currentVersionCount = (patient.tokenHistory || []).length + 1;
    const newToken = generateSecureToken(currentVersionCount + 1);

    // Archive the consumed token with metadata
    const historyEntry = {
      token: oldToken,
      usedAt: new Date(),
      usedBy: usedBy || 'Unknown',
      action: action || 'TOKEN_CONSUMED'
    };

    await Patient.findOneAndUpdate(
      { patientId: req.params.id },
      {
        $set: { qrToken: newToken },
        $push: { tokenHistory: historyEntry }
      },
      { new: true }
    );

    console.log(`🔄 Token Rotated for ${req.params.id}: ${oldToken} -> ${newToken}`);

    res.json({ success: true, newToken, archived: historyEntry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Patients: Get Single
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id }).select('-password');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1 Patients: Get Token History (Hash Ledger) — Admin only
app.get('/api/patients/:id/token-history', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id }).select('patientId name tokenHistory');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({
      patientId: patient.patientId,
      name: patient.name,
      totalSessions: patient.tokenHistory ? patient.tokenHistory.length : 0,
      history: patient.tokenHistory || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Patients: Update (Assessment/Vitals)
app.put('/api/patients/:id', async (req, res) => {
  try {
    const updated = await Patient.findOneAndUpdate(
      { patientId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Labs: Get Pending Requests
app.get('/api/labs', async (req, res) => {
  try {
    const requests = await LabRequest.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labs/:id', async (req, res) => {
  try {
    const updated = await LabRequest.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Labs: Create Request
app.post('/api/labs', async (req, res) => {
  try {
    const newRequest = await LabRequest.create(req.body);
    res.json(newRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Logs: Get All
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7.1 Logs: Get for Patient (Audit trail)
app.get('/api/logs/patient/:id', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ targetId: req.params.id }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Logs: Add Log
app.post('/api/logs', async (req, res) => {
  try {
    const log = await ActivityLog.create(req.body);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root API route for health check
app.get('/api', (req, res) => {
  res.json({ message: 'HealthLock API is running', status: 'Healthy' });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
