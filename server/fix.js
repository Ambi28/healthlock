const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    
    // Fix sony@health.com
    await db.collection('users').updateOne(
        { username: 'sony@health.com' },
        { $set: { role: 'DOCTOR', password: 'Sony@123' } },
        { upsert: true }
    );
    
    // Fix vinnu@health.com
    await db.collection('users').updateOne(
        { username: 'vinnu@health.com' },
        { $set: { role: 'DOCTOR', password: 'Vinnu@123' } },
        { upsert: true }
    );
    
    // Fix lalitha@health.com
    await db.collection('users').updateOne(
        { username: 'lalitha@health.com' },
        { $set: { role: 'DOCTOR', password: 'Lalitha@123' } },
        { upsert: true }
    );

    console.log("Passwords and accounts successfully seeded and fixed");
    process.exit(0);
});
