/* ============================================================
   MongoDB Connection Configuration
   ============================================================ */

const mongoose = require('mongoose');

async function migratePaymentPhaseToTitle() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const col = db.collection('payments');
    const cursor = col.find({
      $and: [
        { phase: { $exists: true, $nin: [null, ''] } },
        { $or: [{ title: { $exists: false } }, { title: null }, { title: '' }] }
      ]
    });
    let n = 0;
    for await (const doc of cursor) {
      await col.updateOne(
        { _id: doc._id },
        { $set: { title: doc.phase }, $unset: { phase: '' } }
      );
      n += 1;
    }
    if (n) console.log(`✦  Migrated ${n} payment line(s): phase → title`);
  } catch (e) {
    console.warn('Payment phase→title migration:', e.message);
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qimora');
    console.log(`✦  MongoDB connected → ${conn.connection.host}`);
    await migratePaymentPhaseToTitle();
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Don't exit — landing page works without DB
    console.warn('⚠  Running without database. Contact form will be unavailable.');
  }
};

module.exports = connectDB;
