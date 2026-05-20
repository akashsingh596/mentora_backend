const router = require('express').Router();
const ctrl   = require('../controllers/session.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isUser, isProfessional } = require('../middleware/role.middleware');

// User routes
router.post('/',      authenticate, isUser, ctrl.createRequest);
router.get('/mine',   authenticate, isUser, ctrl.myRequests);

// Professional routes
router.get('/incoming',       authenticate, isProfessional, ctrl.incomingRequests);
router.put('/:id/status',     authenticate, isProfessional, ctrl.updateStatus);

module.exports = router;
