#!/usr/bin/env node

const { decodeGoogleMapsLink } = require('../src/models/listingModel');

const link = process.argv[2];

if (!link) {
  console.error('Usage: node scripts/decode-google-maps-link.js <google-maps-link>');
  process.exit(1);
}

decodeGoogleMapsLink(link, true)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
