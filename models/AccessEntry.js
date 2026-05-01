/* ============================================================
   Client access credentials / service endpoints
   ============================================================ */

const mongoose = require('mongoose');

const CATEGORY = ['server', 'database', 'service'];

const accessEntrySchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: CATEGORY,
      required: true,
      default: 'service'
    },
    label: { type: String, required: true, trim: true },
    host: { type: String, trim: true, default: '' },
    port: { type: String, trim: true, default: '' },
    username: { type: String, trim: true, default: '' },
    password: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: 'server' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

accessEntrySchema.index({ clientId: 1, order: 1 });

const AccessEntry = mongoose.model('AccessEntry', accessEntrySchema);
AccessEntry.ACCESS_CATEGORIES = CATEGORY;
module.exports = AccessEntry;
