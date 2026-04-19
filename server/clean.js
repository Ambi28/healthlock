const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    
    // Delete any users with role 'PATIENT' since patients belong in the Patient collection
    await db.collection('users').deleteMany({ role: 'PATIENT' });
    
    // Also, if sony@health.com exists, ensure it's a DOCTOR with the correct password
    const sony = await db.collection('users').findOne({ username: 'sony@health.com' });
    if (sony && sony.role !== 'DOCTOR') {
        await db.collection('users').updateOne(
            { username: 'sony@health.com' },
            { $set: { role: 'DOCTOR', password: 'Sony@123' } }
        );
    }

    console.log("Cleanup complete");
    process.exit(0);
});
