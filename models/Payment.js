/* ============================================================
   Client financial line items / payments
   ============================================================ */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    date: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    /** Short label shown on dashboard / financials (replaces legacy `phase`) */
    title: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, trim: true, default: 'USD' },
    status: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'paid'
    },
    photos: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

paymentSchema.index({ clientId: 1, date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
