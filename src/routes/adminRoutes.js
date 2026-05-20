const express = require('express');

const {
  listingsDestroy,
  listingsFeatured,
  listingsIndex,
  listingsModerate,
  usersActivities,
  usersDestroy,
  usersIndex,
  usersNotify,
  usersUpdate
} = require('../controllers/adminController');
const { requireAdmin, requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', usersIndex);
router.get('/users/:id/activities', usersActivities);
router.post('/users/:id/notifications', usersNotify);
router.put('/users/:id', usersUpdate);
router.delete('/users/:id', usersDestroy);

router.get('/listings', listingsIndex);
router.put('/listings/:id/featured', listingsFeatured);
router.put('/listings/:id/moderation', listingsModerate);
router.delete('/listings/:id', listingsDestroy);

module.exports = router;
