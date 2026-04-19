const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    
    // Log all patients and their passwords
    const patients = await db.collection('patients').find().toArray();
    patients.forEach(p => console.log(`${p.patientId} | ${p.name} | ${p.password} | ${p.qrToken}`));

    process.exit(0);
});
