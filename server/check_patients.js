const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    const patients = await db.collection('patients').find().toArray();
    console.log(JSON.stringify(patients.map(p => ({ 
        patientId: p.patientId, 
        name: p.name, 
        qrToken: p.qrToken,
        historyCount: (p.tokenHistory || []).length 
    })), null, 2));
    process.exit(0);
});
