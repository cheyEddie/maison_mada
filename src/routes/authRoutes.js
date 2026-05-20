const express = require('express');

const { login, logout, me, notifications, readNotifications, register, verification } = require('../controllers/authController');
const { uploadIdentityDocuments } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.get('/notifications', notifications);
router.post('/notifications/read', readNotifications);
router.post('/verification', uploadIdentityDocuments, verification);
router.post('/logout', logout);

module.exports = router;
