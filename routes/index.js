/* ============================================================
   Main Routes
   ============================================================ */

const express = require('express');
const router  = express.Router();
const { getHomePage, getCaseStudy } = require('../controllers/homeController');

// Landing page
router.get('/', getHomePage);

// Case study pages
router.get('/case-study/:id', getCaseStudy);

module.exports = router;
