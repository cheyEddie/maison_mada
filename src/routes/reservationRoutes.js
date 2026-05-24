const express = require('express');

const { create, mine, ownerUpdate, pay } = require('../controllers/reservationController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/mine', mine);
router.post('/', create);
router.post('/:id/pay', pay);
router.put('/owner/:id', ownerUpdate);

module.exports = router;
