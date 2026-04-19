const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/health').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find().toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
});
