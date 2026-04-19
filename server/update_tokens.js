const mongoose = require('mongoose');
const crypto = require('crypto');

async function updateTokens() {
  try {
    await mongoose.connect('mongodb://localhost:27017/health');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const patients = await db.collection('patients').find().toArray();

    console.log(`Updating tokens for ${patients.length} patients...`);

    for (const patient of patients) {
      const newToken = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16-digit hex
      await db.collection('patients').updateOne(
        { _id: patient._id },
        { $set: { qrToken: newToken } }
      );
      console.log(`Updated ${patient.patientId} (${patient.name}): ${newToken}`);
    }

    console.log('✅ All tokens updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating tokens:', err);
    process.exit(1);
  }
}

updateTokens();
