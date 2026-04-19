const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    
    // Patch legacy patients without qrTokens
    await db.collection('patients').updateMany(
        { qrToken: { $exists: false } },
        { $set: { qrToken: 'TEST-99-9Z' } }
    );
    
    // Also log all tokens so we can tell the user
    const patients = await db.collection('patients').find().toArray();
    patients.forEach(p => console.log(`${p.patientId} | ${p.name} | ${p.qrToken}`));

    console.log("Tokens patched successfully");
    process.exit(0);
});
