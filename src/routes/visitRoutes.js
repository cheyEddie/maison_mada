const express = require('express');

const { agentUpdate, create, mine, pay } = require('../controllers/visitController');
const { requireAgent, requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/mine', mine);
router.post('/', create);
router.post('/:id/pay', pay);
router.put('/agent/:id', requireAgent, agentUpdate);

module.exports = router;
