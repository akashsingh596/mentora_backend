const { error } = require('../utils/response');

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, `Access denied. Required: ${roles.join(' or ')}`, 403);
    }
    next();
  };
};

exports.isAdmin        = exports.requireRole('super_admin');
exports.isProfessional = exports.requireRole('professional');
exports.isUser         = exports.requireRole('user');
exports.isAdminOrPro   = exports.requireRole('super_admin', 'professional');
