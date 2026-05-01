/* ============================================================
   Admin routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireAuth, redirectIfAuthed } = require('../middleware/adminAuth');

router.get('/login', redirectIfAuthed, ctrl.getLogin);
router.post('/login', ctrl.postLogin);
router.post('/logout', requireAuth, ctrl.logout);

router.get('/', requireAuth, ctrl.dashboard);
router.get('/messages', requireAuth, ctrl.listMessages);
router.post('/messages/:id/read', requireAuth, ctrl.markMessageRead);
router.post('/messages/:id/delete', requireAuth, ctrl.messageDelete);
router.get('/meetings', requireAuth, ctrl.listMeetings);
router.post('/meetings/bulk', requireAuth, ctrl.meetingBulk);
router.post('/meetings/:id/confirm', requireAuth, ctrl.meetingConfirm);
router.post('/meetings/:id/complete', requireAuth, ctrl.meetingComplete);
router.post('/meetings/:id/cancel', requireAuth, ctrl.meetingCancel);
router.post('/meetings/:id/delete', requireAuth, ctrl.meetingDelete);
router.get('/projects/new', requireAuth, ctrl.newProject);
router.post('/projects', requireAuth, ctrl.uploadMiddleware, ctrl.createProject);
router.get('/projects/:id/edit', requireAuth, ctrl.editProject);
router.post('/projects/:id', requireAuth, ctrl.uploadMiddleware, ctrl.updateProject);
router.post('/projects/:id/delete', requireAuth, ctrl.deleteProject);
router.post('/projects/:id/toggle-publish', requireAuth, ctrl.togglePublish);

module.exports = router;
