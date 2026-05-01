/* ============================================================
   Monthly maintenance & updates log per client
   ============================================================ */

const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    title: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 4 },
    cost: { type: Number, default: 0 },
    currency: { type: String, trim: true, default: 'USD' },
    summary: { type: String, trim: true, default: '' },
    details: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

maintenanceLogSchema.index({ clientId: 1, year: -1, month: -1 });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
