/* ============================================================
   Booking API — public read availability + create booking
   ============================================================ */

const express = require('express');
const router = express.Router();
const booking = require('../../controllers/bookingController');

router.get('/availability', booking.getAvailability);
router.get('/check-email', booking.checkEmail);
router.post('/', booking.createBooking);
router.post('/reschedule', booking.rescheduleBooking);

module.exports = router;
