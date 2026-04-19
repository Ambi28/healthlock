const mongoose = require('mongoose');

async function checkLabs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/health');
    const db = mongoose.connection.db;
    
    console.log('--- Lab Requests ---');
    const labs = await db.collection('labrequests').find().toArray();
    console.log(JSON.stringify(labs, null, 2));

    console.log('\n--- Patients (requested status) ---');
    const patients = await db.collection('patients').find({ 
      $or: [
        { approvalStatus: 'Requested' },
        { approvalStatus: 'Approved' },
        { approvalStatus: 'Request Sent' }
      ] 
    }).toArray();
    console.log(JSON.stringify(patients, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLabs();
