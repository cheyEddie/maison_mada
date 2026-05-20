const { getListingStats } = require('../models/listingModel');

async function show(req, res, next) {
  try {
    res.json(await getListingStats());
  } catch (error) {
    next(error);
  }
}

module.exports = { show };
