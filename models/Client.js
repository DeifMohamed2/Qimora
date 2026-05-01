/* ============================================================
   Client portal user — Mongoose model
   ============================================================ */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 64
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    company: { type: String, trim: true, default: '' },
    /** Set by admin — start of “system live” / uptime on the client dashboard */
    activeSince: { type: Date, default: null }
  },
  { timestamps: true }
);

clientSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

clientSchema.statics.hashPassword = function hashPassword(plain) {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(plain, salt);
};

module.exports = mongoose.model('Client', clientSchema);
