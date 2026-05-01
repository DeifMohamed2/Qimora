/* ============================================================
   Meeting booking — Cairo-based slots; one active booking per slot
   ============================================================ */

const mongoose = require('mongoose');

const meetingBookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120
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
      maxlength: 120
    },
    agenda: {
      type: String,
      required: [true, 'Meeting agenda is required'],
      trim: true,
      maxlength: 4000
    },
    whatsappPhone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    viewerTimeZone: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Africa/Cairo'
    },
    startsAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    googleEventId: {
      type: String,
      trim: true,
      maxlength: 200
    },
    meetLink: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    guestNotifiedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/* startsAt index is non-unique so a cancelled row can coexist with history;
   active-slot conflicts are enforced in bookingController + availability query. */
meetingBookingSchema.index({ startsAt: 1 });
meetingBookingSchema.index({ startsAt: -1, status: 1 });
meetingBookingSchema.index({ email: 1, status: 1 });
meetingBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MeetingBooking', meetingBookingSchema);
