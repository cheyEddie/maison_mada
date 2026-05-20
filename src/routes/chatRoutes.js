const express = require('express');

const {
  conversationsIndex,
  directStore,
  messagesIndex,
  supportStore
} = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/conversations', conversationsIndex);
router.post('/direct', directStore);
router.post('/support', supportStore);
router.get('/conversations/:id/messages', messagesIndex);

module.exports = router;
