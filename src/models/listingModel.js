const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');
const arrondissementsTananarive = require('../data/arrondissements_tananarive.json');
const { seedListings } = require('../data/seedListings');

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80';
const MIN_IMAGES = 3;
const MAX_IMAGES = 5;

function listings() {
  return getDatabase().collection('listings');
}

function users() {
  return getDatabase().collection('users');
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanLimit(value, fallback = 30) {
  const limit = Math.trunc(cleanNumber(value, fallback));
  return Math.min(Math.max(limit, 1), 100);
}

function cleanBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function cleanWaterSource(value) {
  return ['puits', 'jirama', 'exterieur'].includes(value) ? value : 'jirama';
}

function cleanInsideOutside(value) {
  return ['interieur', 'exterieur'].includes(value) ? value : 'interieur';
}

function cleanCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(7)) : null;
}

function normalizeDistrictText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const arrondissementMatchers = arrondissementsTananarive.arrondissements
  .flatMap((arrondissement) => arrondissement.quartiers.map((quartier) => ({
    numero: arrondissement.numero,
    nom: arrondissement.nom,
    quartier,
    normalized: normalizeDistrictText(quartier)
  })))
  .filter((item) => item.normalized.length >= 3)
  .sort((a, b) => b.normalized.length - a.normalized.length);

function resolveArrondissement(location) {
  const normalizedLocation = normalizeDistrictText(location);
  if (!normalizedLocation) return null;

  const match = arrondissementMatchers.find((item) => (
    normalizedLocation.includes(item.normalized) || item.normalized.includes(normalizedLocation)
  ));

  if (!match) return null;

  return {
    numero: match.numero,
    nom: match.nom,
    quartier: match.quartier,
    label: `${match.numero}e arrondissement - ${match.nom}`
  };
}

function cleanMapUrl(value) {
  const url = String(value || '').trim();
  let parsed;

  try {
    parsed = new URL(url);
  } catch (_error) {
    const error = new Error('Le lien Google Maps est invalide');
    error.status = 400;
    throw error;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const googleDomain = /(^|\.)google\.[a-z.]+$/.test(host);
  const allowedShortener = host === 'maps.app.goo.gl' || host === 'goo.gl';
  const allowedGoogleMaps = googleDomain && (host.startsWith('maps.google.') || parsed.pathname.startsWith('/maps'));

  if (!['http:', 'https:'].includes(parsed.protocol) || (!allowedShortener && !allowedGoogleMaps)) {
    const error = new Error('Indiquez un lien Google Maps valide');
    error.status = 400;
    throw error;
  }

  return parsed.href;
}

function dmsToDecimal(degrees, minutes, seconds, direction) {
  const decimal = Number(degrees) + (Number(minutes) / 60) + (Number(seconds || 0) / 3600);
  const signed = ['S', 'W'].includes(String(direction || '').toUpperCase()) ? -decimal : decimal;
  return cleanCoordinate(signed);
}

function extractMapCoordinates(value) {
  try {
    const raw = decodeURIComponent(String(value || ''));
    const url = new URL(raw);
    const decodedUrl = decodeURIComponent(url.href);

    const placeCoordinates = decodedUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (placeCoordinates) {
      return {
        lat: cleanCoordinate(placeCoordinates[1]),
        lng: cleanCoordinate(placeCoordinates[2])
      };
    }

    const reverseCoordinates = decodedUrl.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
    if (reverseCoordinates) {
      return {
        lat: cleanCoordinate(reverseCoordinates[2]),
        lng: cleanCoordinate(reverseCoordinates[1])
      };
    }

    const atCoordinates = decodedUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atCoordinates) {
      return {
        lat: cleanCoordinate(atCoordinates[1]),
        lng: cleanCoordinate(atCoordinates[2])
      };
    }

    const queryCoordinates = (url.searchParams.get('query') || url.searchParams.get('q') || '')
      .match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (queryCoordinates) {
      return {
        lat: cleanCoordinate(queryCoordinates[1]),
        lng: cleanCoordinate(queryCoordinates[2])
      };
    }

    const dmsCoordinates = decodedUrl.match(/(\d+(?:\.\d+)?)°(\d+(?:\.\d+)?)'(?:(\d+(?:\.\d+)?)")?([NS])\+(\d+(?:\.\d+)?)°(\d+(?:\.\d+)?)'(?:(\d+(?:\.\d+)?)")?([EW])/i);
    if (dmsCoordinates) {
      return {
        lat: dmsToDecimal(dmsCoordinates[1], dmsCoordinates[2], dmsCoordinates[3], dmsCoordinates[4]),
        lng: dmsToDecimal(dmsCoordinates[5], dmsCoordinates[6], dmsCoordinates[7], dmsCoordinates[8])
      };
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function mapEmbedUrlFromCoordinates(coordinates) {
  if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) return '';
  return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=18&output=embed`;
}

function mapEmbedUrlFromValue(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.pathname.includes('/maps/embed')) return url.href;

    const coordinatesEmbed = mapEmbedUrlFromCoordinates(extractMapCoordinates(url.href));
    if (coordinatesEmbed) return coordinatesEmbed;

    const query = url.searchParams.get('query') || url.searchParams.get('q');
    if (query) {
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=18&output=embed`;
    }

    const placeMatch = decodeURIComponent(url.href).match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
      return `https://www.google.com/maps?q=${encodeURIComponent(placeMatch[1].replace(/\+/g, ' '))}&z=18&output=embed`;
    }
  } catch (_error) {
    return '';
  }

  return '';
}

async function expandGoogleMapsUrl(mapUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(mapUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': 'Mozilla/5.0 MaisonMada/1.0'
      },
      signal: controller.signal
    });
    const location = response.headers.get('location');
    if (!location) return response.url || mapUrl;
    return new URL(location, mapUrl).href;
  } catch (_error) {
    return mapUrl;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapPayload(value, required = false) {
  if (!required && (value === undefined || value === null || String(value).trim() === '')) return {};

  const mapUrl = cleanMapUrl(value);
  const mapResolvedUrl = await expandGoogleMapsUrl(mapUrl);
  const mapCoordinates = extractMapCoordinates(mapResolvedUrl) || extractMapCoordinates(mapUrl);
  const mapEmbedUrl = mapEmbedUrlFromCoordinates(mapCoordinates)
    || mapEmbedUrlFromValue(mapResolvedUrl)
    || mapEmbedUrlFromValue(mapUrl);

  if (required && !mapEmbedUrl) {
    const error = new Error('Impossible de lire la localisation precise depuis ce lien Google Maps');
    error.status = 400;
    throw error;
  }

  return {
    mapUrl,
    mapResolvedUrl: mapResolvedUrl === mapUrl ? '' : mapResolvedUrl,
    mapCoordinates,
    mapEmbedUrl
  };
}

async function ensureListingMapEmbeds() {
  const cursor = listings().find({
    mapUrl: { $exists: true, $ne: '' },
    $or: [
      { mapEmbedUrl: { $exists: false } },
      { mapEmbedUrl: '' },
      { mapCoordinates: { $exists: false } }
    ]
  });

  for await (const listing of cursor) {
    const nextMap = await mapPayload(listing.mapUrl, false).catch(() => null);
    if (!nextMap?.mapEmbedUrl) continue;
    await listings().updateOne(
      { _id: listing._id },
      { $set: { ...nextMap, updatedAt: new Date() } }
    );
  }
}

function uploadedImages(files = {}) {
  const images = Array.isArray(files) ? files : files.image || [];
  return images.map((file) => `/uploads/${file.filename}`);
}

function uploadedVideo(files = {}) {
  const videos = Array.isArray(files) ? [] : files.video || [];
  return videos[0] ? `/uploads/${videos[0].filename}` : '';
}

function validateImageCount(images, required = false) {
  if (images.length > MAX_IMAGES) {
    const error = new Error(`Vous pouvez ajouter ${MAX_IMAGES} photos maximum`);
    error.status = 400;
    throw error;
  }

  if (required && images.length < MIN_IMAGES) {
    const error = new Error(`Vous devez ajouter au moins ${MIN_IMAGES} photos`);
    error.status = 400;
    throw error;
  }

  if (!required && images.length > 0 && images.length < MIN_IMAGES) {
    const error = new Error(`Si vous remplacez les photos, ajoutez au moins ${MIN_IMAGES} photos`);
    error.status = 400;
    throw error;
  }
}

function createReference() {
  const suffix = String(Math.floor(100000 + Math.random() * 900000));
  return `MM-${suffix}`;
}

function isHouseRental(body) {
  return String(body.dealType) === 'location' && String(body.propertyType) === 'maison';
}

function isCommercialPremises(body) {
  return String(body.propertyType) === 'local_commercial';
}

function isPersonalAllowedListing(body) {
  return isHouseRental(body) || (String(body.dealType) === 'location' && isCommercialPremises(body));
}

function validateListingRights(body, user) {
  if (user.role !== 'admin' && user.identityVerified !== true) {
    const error = new Error('Votre compte doit etre verifie avant de publier une annonce');
    error.status = 403;
    throw error;
  }

  if (user.role === 'admin' || user.accountType === 'agence') return;
  if (isPersonalAllowedListing(body)) return;

  const error = new Error('Un compte particulier peut publier uniquement des maisons ou locaux commerciaux en location');
  error.status = 403;
  throw error;
}

function buildFilter(query = {}) {
  const filter = {};

  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: 'i' } },
      { location: { $regex: query.q, $options: 'i' } },
      { propertyType: { $regex: query.q, $options: 'i' } },
      { reference: { $regex: query.q, $options: 'i' } }
    ];
  }

  if (query.dealType && query.dealType !== 'all') filter.dealType = query.dealType;
  if (query.propertyType && query.propertyType !== 'all') filter.propertyType = query.propertyType;
  if (query.maxPrice) filter.price = { $lte: cleanNumber(query.maxPrice) };
  if (query.featured === 'true') filter.featured = true;
  if (query.ownerId) {
    if (!ObjectId.isValid(query.ownerId)) {
      filter.ownerId = new ObjectId('000000000000000000000000');
    } else {
      filter.ownerId = new ObjectId(query.ownerId);
    }
  }
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (!query.includeModeration) {
    filter.status = 'approved';
    filter.$and = [
      {
        $or: [
          { propertyType: { $ne: 'maison' } },
          { isAvailable: { $ne: false } }
        ]
      }
    ];
  }

  return filter;
}

async function listingPayload(body, user, files) {
  const requiredFields = ['title', 'location', 'mapUrl', 'dealType', 'propertyType', 'price'];
  const images = uploadedImages(files);
  const video = uploadedVideo(files);

  for (const field of requiredFields) {
    if (!body[field]) {
      const error = new Error(`${field} est obligatoire`);
      error.status = 400;
      throw error;
    }
  }

  validateListingRights(body, user);
  validateImageCount(images, true);
  const map = await mapPayload(body.mapUrl, true);

  const location = String(body.location).trim();
  const commercialPremises = isCommercialPremises(body);

  return {
    title: String(body.title).trim(),
    location,
    arrondissement: resolveArrondissement(location),
    mapUrl: map.mapUrl,
    mapResolvedUrl: map.mapResolvedUrl,
    mapCoordinates: map.mapCoordinates,
    mapEmbedUrl: map.mapEmbedUrl,
    dealType: String(body.dealType),
    propertyType: String(body.propertyType),
    price: cleanNumber(body.price),
    bedrooms: cleanNumber(body.bedrooms),
    area: isHouseRental(body) ? 0 : cleanNumber(body.area),
    description: String(body.description || '').trim(),
    hasElectricity: cleanBoolean(body.hasElectricity),
    waterSource: commercialPremises ? '' : cleanWaterSource(body.waterSource),
    hasTapWater: commercialPremises ? false : cleanWaterSource(body.waterSource) !== 'exterieur',
    showerLocation: commercialPremises ? '' : cleanInsideOutside(body.showerLocation || body.showerWcLocation),
    wcLocation: commercialPremises ? '' : cleanInsideOutside(body.wcLocation || body.showerWcLocation),
    hasMotorbikeAccess: cleanBoolean(body.hasMotorbikeAccess),
    hasCarAccess: cleanBoolean(body.hasCarAccess),
    isAvailable: cleanBoolean(body.isAvailable),
    isStudentHousing: false,
    image: images[0],
    images,
    video,
    reference: createReference(),
    featured: false,
    status: user.role === 'admin' ? 'approved' : 'pending',
    ownerId: new ObjectId(user._id),
    ownerName: user.name,
    ownerPhone: user.phone || '',
    createdAt: new Date()
  };
}

async function listingUpdatePayload(body, files, existingListing, user) {
  const payload = {};
  const images = uploadedImages(files);
  const video = uploadedVideo(files);
  validateImageCount(images, false);
  const textFields = ['title', 'location', 'dealType', 'propertyType', 'description'];
  const numberFields = ['price', 'bedrooms', 'area'];
  const booleanFields = ['hasElectricity', 'hasMotorbikeAccess', 'hasCarAccess', 'isAvailable'];

  textFields.forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') {
      payload[field] = String(body[field]).trim();
    }
  });

  if (payload.location !== undefined) {
    payload.arrondissement = resolveArrondissement(payload.location);
  }

  numberFields.forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') {
      payload[field] = cleanNumber(body[field]);
    }
  });

  booleanFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = cleanBoolean(body[field]);
    }
  });

  if (body.waterSource !== undefined && body.waterSource !== '') {
    payload.waterSource = cleanWaterSource(body.waterSource);
    payload.hasTapWater = payload.waterSource !== 'exterieur';
  }

  if (body.showerLocation !== undefined && body.showerLocation !== '') {
    payload.showerLocation = cleanInsideOutside(body.showerLocation);
  }

  if (body.wcLocation !== undefined && body.wcLocation !== '') {
    payload.wcLocation = cleanInsideOutside(body.wcLocation);
  }

  if (body.mapUrl !== undefined) {
    Object.assign(payload, await mapPayload(body.mapUrl, false));
  }

  if (images.length) {
    payload.image = images[0];
    payload.images = images;
  }

  if (video) {
    payload.video = video;
  }

  const nextListing = { ...existingListing, ...payload };
  validateListingRights(nextListing, user);
  if (isHouseRental(nextListing)) payload.area = 0;
  if (isCommercialPremises(nextListing)) {
    payload.waterSource = '';
    payload.hasTapWater = false;
    payload.showerLocation = '';
    payload.wcLocation = '';
  }

  payload.updatedAt = new Date();
  return payload;
}

async function ensureListingIndexes() {
  await listings().createIndex({ title: 'text', location: 'text', propertyType: 'text' });
  await listings().createIndex({ reference: 1 }, { unique: true, sparse: true });
}

async function seedListingsIfEmpty() {
  const count = await listings().countDocuments();
  if (count > 0) return;

  await listings().insertMany(
    seedListings.map((listing, index) => ({
      ...listing,
      reference: createReference(),
      status: 'approved',
      ownerId: null,
      ownerName: 'MaisonMada',
      ownerPhone: '',
      video: '',
      createdAt: new Date(Date.now() - index * 86400000)
    }))
  );
}

async function ensureOwnerPhones() {
  const cursor = listings().find({
    ownerId: { $ne: null },
    $or: [{ ownerPhone: { $exists: false } }, { ownerPhone: '' }]
  });

  for await (const listing of cursor) {
    const owner = await users().findOne({ _id: new ObjectId(listing.ownerId) }, { projection: { phone: 1 } });
    if (!owner?.phone) continue;

    await listings().updateOne(
      { _id: listing._id },
      { $set: { ownerPhone: owner.phone } }
    );
  }
}

async function ensureReferences() {
  const cursor = listings().find({
    $or: [
      { reference: { $exists: false } },
      { reference: '' },
      { reference: null }
    ]
  });

  for await (const listing of cursor) {
    let reference = createReference();
    while (await listings().findOne({ reference })) {
      reference = createReference();
    }

    await listings().updateOne(
      { _id: listing._id },
      { $set: { reference } }
    );
  }
}

async function ensureReferenceFormat() {
  const cursor = listings().find({ reference: { $not: /^MM-\d+$/ } });

  for await (const listing of cursor) {
    let reference = createReference();
    while (await listings().findOne({ reference })) {
      reference = createReference();
    }

    await listings().updateOne(
      { _id: listing._id },
      { $set: { reference } }
    );
  }
}

async function ensureUtilityFields() {
  const utilityDefaults = [
    'hasElectricity',
    'hasTapWater',
    'hasMotorbikeAccess',
    'hasCarAccess'
  ];

  for (const field of utilityDefaults) {
    await listings().updateMany(
      { [field]: { $exists: false } },
      [{ $set: { [field]: { $ne: ['$propertyType', 'terrain'] } } }]
    );
  }

  await listings().updateMany(
    { waterSource: { $exists: false } },
    [
      {
        $set: {
          waterSource: {
            $cond: [{ $eq: ['$hasTapWater', false] }, 'exterieur', 'jirama']
          }
        }
      }
    ]
  );
}

async function ensureListingArrondissements() {
  const cursor = listings().find({});

  for await (const listing of cursor) {
    const arrondissement = resolveArrondissement(listing.location);
    const currentLabel = listing.arrondissement?.label || '';
    const nextLabel = arrondissement?.label || '';
    if (currentLabel === nextLabel) continue;

    await listings().updateOne(
      { _id: listing._id },
      { $set: { arrondissement } }
    );
  }
}

async function ensureAvailabilityFields() {
  await listings().updateMany(
    { isAvailable: { $exists: false } },
    { $set: { isAvailable: true } }
  );

  await listings().updateMany(
    { isStudentHousing: { $exists: false } },
    { $set: { isStudentHousing: false } }
  );

  await listings().updateMany(
    { showerLocation: { $exists: false } },
    [{ $set: { showerLocation: { $ifNull: ['$showerWcLocation', 'interieur'] } } }]
  );

  await listings().updateMany(
    { wcLocation: { $exists: false } },
    [{ $set: { wcLocation: { $ifNull: ['$showerWcLocation', 'interieur'] } } }]
  );
}

async function ensureDescriptions() {
  for (const seedListing of seedListings) {
    await listings().updateMany(
      {
        title: seedListing.title,
        $or: [
          { description: { $exists: false } },
          { description: '' },
          { description: null }
        ]
      },
      { $set: { description: seedListing.description } }
    );
  }
}

async function ensureImageArrays() {
  const cursor = listings().find({
    $or: [
      { images: { $exists: false } },
      { images: { $size: 0 } }
    ]
  });

  for await (const listing of cursor) {
    const image = listing.image || DEFAULT_IMAGE;
    await listings().updateOne(
      { _id: listing._id },
      {
        $set: {
          image,
          images: [image]
        }
      }
    );
  }
}

async function ensureListingStatuses() {
  await listings().updateMany(
    { status: { $exists: false } },
    { $set: { status: 'approved' } }
  );
}

async function removeDeprecatedFields() {
  await listings().updateMany(
    { bathrooms: { $exists: true } },
    { $unset: { bathrooms: '' } }
  );
}

async function findListings(query) {
  return listings()
    .find(buildFilter(query))
    .sort({ featured: -1, createdAt: -1 })
    .limit(cleanLimit(query.limit))
    .toArray();
}

async function findListingById(id, query = {}) {
  if (!ObjectId.isValid(id)) return null;

  return listings().findOne({
    ...buildFilter(query),
    _id: new ObjectId(id)
  });
}

async function findAdminListings(query = {}) {
  return findListings({ ...query, includeModeration: true });
}

async function findPublicProfile(userId) {
  if (!ObjectId.isValid(userId)) return null;
  const ownerId = new ObjectId(userId);
  const user = await users().findOne(
    { _id: ownerId },
    { projection: { passwordHash: 0 } }
  );
  if (!user) return null;

  const publicListings = await findListings({ ownerId, limit: 100 });
  return {
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'user',
      accountType: user.accountType || 'particulier',
      reference: user.reference || '',
      createdAt: user.createdAt
    },
    listings: publicListings
  };
}

async function createListing(body, user, files) {
  const listing = await listingPayload(body, user, files);
  while (await listings().findOne({ reference: listing.reference })) {
    listing.reference = createReference();
  }
  const result = await listings().insertOne(listing);
  return { ...listing, _id: result.insertedId };
}

async function deleteListing(id, user) {
  return listings().deleteOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user._id)
  });
}

async function deleteListingAsAdmin(id) {
  return listings().deleteOne({ _id: new ObjectId(id) });
}

async function updateListing(id, user, body, files) {
  const existingListing = await listings().findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user._id)
  });

  if (!existingListing) return null;

  if (user.role !== 'admin' && existingListing.status === 'pending') {
    const error = new Error('Une annonce en moderation ne peut plus etre modifiee');
    error.status = 403;
    throw error;
  }

  const payload = await listingUpdatePayload(body, files, existingListing, user);
  if (user.role !== 'admin') payload.status = 'pending';

  if (!Object.keys(payload).length) {
    const error = new Error('Aucune donnee a modifier');
    error.status = 400;
    throw error;
  }

  const result = await listings().findOneAndUpdate(
    { _id: existingListing._id },
    { $set: payload },
    { returnDocument: 'after' }
  );

  return result;
}

async function updateListingAsAdmin(id, user, body, files) {
  if (!ObjectId.isValid(id)) return null;

  const existingListing = await listings().findOne({ _id: new ObjectId(id) });
  if (!existingListing) return null;

  const payload = await listingUpdatePayload(body, files, existingListing, user);
  if (!Object.keys(payload).length) {
    const error = new Error('Aucune donnee a modifier');
    error.status = 400;
    throw error;
  }

  return listings().findOneAndUpdate(
    { _id: existingListing._id },
    { $set: payload },
    { returnDocument: 'after' }
  );
}

async function moderateListing(id, status, reason = '') {
  const allowed = ['approved', 'rejected', 'pending'];
  if (!allowed.includes(status)) {
    const error = new Error('Statut de moderation invalide');
    error.status = 400;
    throw error;
  }

  const payload = {
    status,
    moderatedAt: new Date(),
    moderationReason: status === 'rejected' ? String(reason || '').trim() : ''
  };

  return listings().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: payload },
    { returnDocument: 'after' }
  );
}

async function updateListingFeatured(id, featured) {
  const listing = await listings().findOne({ _id: new ObjectId(id) });
  if (!listing) return null;

  if (listing.status !== 'approved' && cleanBoolean(featured)) {
    const error = new Error('Une annonce en attente ou refusee ne peut pas etre mise a la une');
    error.status = 400;
    throw error;
  }

  return listings().findOneAndUpdate(
    { _id: listing._id },
    { $set: { featured: cleanBoolean(featured), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function getListingStats() {
  const publicFilter = {
    status: 'approved',
    $or: [
      { propertyType: { $ne: 'maison' } },
      { isAvailable: { $ne: false } }
    ]
  };
  const [location, vente, maison, appartement, terrain] = await Promise.all([
    listings().countDocuments({ ...publicFilter, dealType: 'location' }),
    listings().countDocuments({ ...publicFilter, dealType: 'vente' }),
    listings().countDocuments({ ...publicFilter, propertyType: 'maison' }),
    listings().countDocuments({ ...publicFilter, propertyType: 'appartement' }),
    listings().countDocuments({ ...publicFilter, propertyType: 'terrain' })
  ]);

  return { location, vente, maison, appartement, terrain };
}

module.exports = {
  createListing,
  decodeGoogleMapsLink: mapPayload,
  deleteListing,
  deleteListingAsAdmin,
  ensureDescriptions,
  ensureAvailabilityFields,
  ensureImageArrays,
  ensureListingIndexes,
  ensureListingArrondissements,
  ensureListingMapEmbeds,
  ensureOwnerPhones,
  ensureReferenceFormat,
  ensureReferences,
  ensureListingStatuses,
  ensureUtilityFields,
  findAdminListings,
  findListingById,
  findListings,
  findPublicProfile,
  getListingStats,
  moderateListing,
  removeDeprecatedFields,
  seedListingsIfEmpty,
  updateListingFeatured,
  updateListing,
  updateListingAsAdmin
};
