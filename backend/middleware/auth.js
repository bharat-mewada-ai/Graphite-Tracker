

const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });

  const token = header.split(' ')[1]; // "Bearer <token>" se token nikalta hai
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};