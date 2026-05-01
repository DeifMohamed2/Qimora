/* ============================================================
   Contact API Routes
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { submitContact, subscribe } = require('../../controllers/contactController');

router.post('/', submitContact);
router.post('/subscribe', subscribe);

module.exports = router;
