const mongoose = require('mongoose');
const crypto = require('crypto');

// Cryptographic token generator — Versioned random hash
const generateSecureToken = (version = 1) => {
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `HTL-${randomPart}-V${version}`;
};

// Define Schema (Must match index.js)
const PatientSchema = new mongoose.Schema({
  patientId: String,
  qrToken: String,
  tokenHistory: [{
    token: String,
    usedAt: { type: Date, default: Date.now },
    usedBy: String,
    action: String
  }],
  name: String
}, { strict: false }); // Use strict: false to allow existing fields without full schema definition

const Patient = mongoose.model('Patient', PatientSchema);

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const patients = await Patient.find();
    
    console.log(`Updating ${patients.length} patients...`);
    
    for (const patient of patients) {
        const currentVersionCount = (patient.tokenHistory || []).length + 1;
        const oldToken = patient.qrToken;
        const newToken = generateSecureToken(currentVersionCount + 1);
        
        patient.qrToken = newToken;
        patient.tokenHistory.push({
            token: oldToken,
            usedAt: new Date(),
            usedBy: 'ADMIN_FIX',
            action: 'DATABASE_TOKEN_UPGRADE'
        });
        
        await patient.save();
        console.log(`✅ Updated ${patient.patientId}: ${oldToken} -> ${newToken}`);
    }
    
    console.log('All patients updated with secure versioned tokens.');
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
