/* ============================================================
   Contact Model — MongoDB / Mongoose
   ============================================================ */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    company: {
      type: String,
      trim: true,
      maxlength: 100
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 80
    },
    customSubject: {
      type: String,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000
    },
    whatsappPhone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
