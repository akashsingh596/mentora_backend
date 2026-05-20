const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

router.get('/dashboard', ctrl.getDashboard);

router.get('/users',             ctrl.getUsers);
router.put('/users/:id/status',  ctrl.updateUserStatus);

router.get('/professionals',              ctrl.getProfessionals);
router.put('/professionals/:id/status',   ctrl.updateProfessionalStatus);

router.get('/sessions',             ctrl.getSessions);
router.put('/sessions/:id/schedule', ctrl.scheduleSession);

module.exports = router;
