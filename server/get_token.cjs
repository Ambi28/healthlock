const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health';

const PatientSchema = new mongoose.Schema({
  patientId: String,
  qrToken: String,
  name: String
});
const Patient = mongoose.model('Patient', PatientSchema);

async function getToken() {
  await mongoose.connect(MONGO_URI);
  const patient = await Patient.findOne({ patientId: 'PAT-001' });
  if (patient) {
    console.log('--- TOKEN DATA ---');
    console.log(`Patient: ${patient.name}`);
    console.log(`Current Access Token: ${patient.qrToken}`);
    console.log('------------------');
  } else {
    console.log('Patient PAT-001 not found.');
  }
  await mongoose.disconnect();
}

getToken();
