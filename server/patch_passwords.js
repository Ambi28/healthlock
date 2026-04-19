const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    
    // Patch legacy patients without passwords
    await db.collection('patients').updateMany(
        { password: { $exists: false } },
        { $set: { password: 'password123' } }
    );
    
    console.log("Legacy patient passwords patched to 'password123'");
    process.exit(0);
});
