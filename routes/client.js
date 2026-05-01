/* ============================================================
   Client portal routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientController');
const { requireClientAuth, redirectIfClientAuthed } = require('../middleware/clientAuth');

router.get('/login', redirectIfClientAuthed, ctrl.getLogin);
router.post('/login', ctrl.postLogin);
router.post('/logout', requireClientAuth, ctrl.logout);

router.get('/', requireClientAuth, ctrl.dashboard);
router.get('/access', requireClientAuth, ctrl.access);
router.get('/financials', requireClientAuth, ctrl.financials);
router.get('/maintenance', requireClientAuth, ctrl.maintenance);

module.exports = router;
