const { findUserByToken } = require('../models/userModel');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const user = await findUserByToken(token);

    if (!user) {
      res.status(401).json({ message: 'Connexion requise' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Acces administrateur requis' });
    return;
  }

  next();
}

function requireAgent(req, res, next) {
  if (!req.user || req.user.role !== 'agent') {
    res.status(403).json({ message: 'Acces agent requis' });
    return;
  }

  next();
}

module.exports = { requireAdmin, requireAgent, requireAuth };
