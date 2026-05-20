const router = require('express').Router();
const ctrl   = require('../controllers/professional.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isProfessional } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/',    ctrl.listProfessionals);
router.get('/:id', ctrl.getProfessional);

// Protected — Professional only
router.get('/me/profile',   authenticate, isProfessional, ctrl.getMyProfile);
router.put('/me/profile',   authenticate, isProfessional, ctrl.updateMyProfile);
router.post('/me/photo',    authenticate, isProfessional, upload.single('profile_photo'), ctrl.uploadPhoto);

module.exports = router;
