const express = require('express');

const { destroy, index, mine, profile, show, store, update } = require('../controllers/listingController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { uploadListingImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', index);
router.get('/mine', requireAuth, mine);
router.get('/profiles/:id', profile);
router.get('/:id', show);
router.post('/', requireAuth, uploadListingImage, store);
router.put('/:id', requireAuth, uploadListingImage, update);
router.delete('/:id', requireAuth, destroy);

module.exports = router;
