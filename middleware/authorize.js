// backend/middleware/authorize.js

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
};

export default authorize;