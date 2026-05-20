const {
  createListing,
  deleteListing,
  findListingById,
  findPublicProfile,
  findListings,
  updateListing
} = require('../models/listingModel');
const { logUserActivity } = require('../models/activityModel');

async function index(req, res, next) {
  try {
    res.json(await findListings(req.query));
  } catch (error) {
    next(error);
  }
}

async function mine(req, res, next) {
  try {
    res.json(await findListings({ ...req.query, ownerId: req.user._id, includeModeration: true }));
  } catch (error) {
    next(error);
  }
}

async function profile(req, res, next) {
  try {
    const data = await findPublicProfile(req.params.id);
    if (!data) {
      res.status(404).json({ message: 'Profil introuvable' });
      return;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const listing = await findListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    res.json(listing);
  } catch (error) {
    next(error);
  }
}

async function store(req, res, next) {
  try {
    const listing = await createListing(req.body, req.user, req.files || []);
    await logUserActivity({
      userId: req.user._id,
      type: 'listing.create',
      label: `Publication de l'annonce ${listing.reference || listing.title}`,
      metadata: { listingId: String(listing._id), reference: listing.reference, title: listing.title }
    });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    const listing = (await findListings({ ownerId: req.user._id, includeModeration: true, limit: 100 }))
      .find((item) => String(item._id) === String(req.params.id));
    const result = await deleteListing(req.params.id, req.user);
    if (!result.deletedCount) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    await logUserActivity({
      userId: req.user._id,
      type: 'listing.delete',
      label: `Suppression de l'annonce ${listing?.reference || req.params.id}`,
      metadata: { listingId: req.params.id, reference: listing?.reference, title: listing?.title }
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const listing = await updateListing(req.params.id, req.user, req.body, req.files || []);
    if (!listing) {
      res.status(404).json({ message: 'Annonce introuvable' });
      return;
    }

    await logUserActivity({
      userId: req.user._id,
      type: 'listing.update',
      label: `Modification de l'annonce ${listing.reference || listing.title}`,
      metadata: { listingId: String(listing._id), reference: listing.reference, title: listing.title }
    });
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

module.exports = { destroy, index, mine, profile, show, store, update };
