const {
  findUserByToken,
  loginUser,
  logoutUser,
  registerUser,
  submitIdentityVerification
} = require('../models/userModel');
const { logUserActivity } = require('../models/activityModel');
const { listNotifications, markNotificationsRead } = require('../models/notificationModel');

function tokenFromRequest(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

async function register(req, res, next) {
  try {
    const session = await registerUser(req.body);
    await logUserActivity({
      userId: session.user._id,
      type: 'auth.register',
      label: 'Creation du compte'
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const session = await loginUser(req.body);
    await logUserActivity({
      userId: session.user._id,
      type: 'auth.login',
      label: 'Connexion'
    });
    res.json(session);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await findUserByToken(tokenFromRequest(req));
    if (!user) {
      res.status(401).json({ message: 'Connexion requise' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = tokenFromRequest(req);
    const user = await findUserByToken(token);
    await logoutUser(token);
    if (user) {
      await logUserActivity({
        userId: user._id,
        type: 'auth.logout',
        label: 'Deconnexion'
      });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function verification(req, res, next) {
  try {
    const user = await findUserByToken(tokenFromRequest(req));
    if (!user) {
      res.status(401).json({ message: 'Connexion requise' });
      return;
    }

    const updatedUser = await submitIdentityVerification(user._id, req.body, req.files || []);
    await logUserActivity({
      userId: user._id,
      type: 'auth.identity_verification',
      label: 'Demande de verification identite'
    });
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
}

async function notifications(req, res, next) {
  try {
    const user = await findUserByToken(tokenFromRequest(req));
    if (!user) {
      res.status(401).json({ message: 'Connexion requise' });
      return;
    }

    res.json(await listNotifications(user._id, req.query.limit));
  } catch (error) {
    next(error);
  }
}

async function readNotifications(req, res, next) {
  try {
    const user = await findUserByToken(tokenFromRequest(req));
    if (!user) {
      res.status(401).json({ message: 'Connexion requise' });
      return;
    }

    await markNotificationsRead(user._id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, me, notifications, readNotifications, register, verification };
