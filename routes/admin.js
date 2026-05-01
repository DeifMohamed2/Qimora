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
router.post('/messages/bulk', requireAuth, ctrl.messagesBulk);
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
router.get('/team', requireAuth, ctrl.listTeam);
router.get('/team/new', requireAuth, ctrl.newTeamMember);
router.post('/team', requireAuth, ctrl.teamPhotoMiddleware, ctrl.createTeamMember);
router.get('/team/:id/edit', requireAuth, ctrl.editTeamMember);
router.post('/team/:id', requireAuth, ctrl.teamPhotoMiddleware, ctrl.updateTeamMember);
router.post('/team/:id/delete', requireAuth, ctrl.deleteTeamMember);
router.post('/team/:id/toggle-publish', requireAuth, ctrl.toggleTeamPublish);

router.get('/clients', requireAuth, ctrl.listClients);
router.get('/clients/new', requireAuth, ctrl.newClient);
router.post('/clients', requireAuth, ctrl.createClient);
router.get('/clients/:id/edit', requireAuth, ctrl.editClient);
router.post('/clients/:id', requireAuth, ctrl.updateClient);
router.post('/clients/:id/delete', requireAuth, ctrl.deleteClient);

router.get('/clients/:id/access', requireAuth, ctrl.manageClientAccess);
router.post('/clients/:id/access', requireAuth, ctrl.createAccessEntry);
router.post('/clients/:id/access/:entryId', requireAuth, ctrl.updateAccessEntry);
router.post('/clients/:id/access/:entryId/delete', requireAuth, ctrl.deleteAccessEntry);

router.get('/clients/:id/payments', requireAuth, ctrl.manageClientPayments);
router.post('/clients/:id/payments', requireAuth, ctrl.paymentPhotosMiddleware, ctrl.createPayment);
router.post('/clients/:id/payments/:paymentId', requireAuth, ctrl.paymentPhotosMiddleware, ctrl.updatePayment);
router.post('/clients/:id/payments/:paymentId/delete', requireAuth, ctrl.deletePayment);
router.post('/clients/:id/payments/:paymentId/photo-delete', requireAuth, ctrl.deletePaymentPhoto);

router.get('/clients/:id/maintenance', requireAuth, ctrl.manageClientMaintenance);
router.post('/clients/:id/maintenance', requireAuth, ctrl.createMaintenanceLog);
router.post('/clients/:id/maintenance/:logId', requireAuth, ctrl.updateMaintenanceLog);
router.post('/clients/:id/maintenance/:logId/delete', requireAuth, ctrl.deleteMaintenanceLog);

module.exports = router;
