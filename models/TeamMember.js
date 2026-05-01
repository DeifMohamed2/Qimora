/* ============================================================
   Team member — Meet Our Team carousel (admin-managed)
   ============================================================ */

const mongoose = require('mongoose');
const { THEME_COUNT } = require('../lib/teamThemes');

const teamMemberSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },

    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    specialty: { type: String, required: true, trim: true },
    years: { type: Number, required: true, min: 0, max: 99 },
    description: { type: String, default: '', trim: true },
    image: { type: String, default: '' },

    theme: {
      type: Number,
      required: true,
      min: 1,
      max: THEME_COUNT,
      default: 1
    },

    socialGithub: { type: String, default: '', trim: true },
    socialLinkedin: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

teamMemberSchema.index({ isPublished: 1, order: 1, name: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
