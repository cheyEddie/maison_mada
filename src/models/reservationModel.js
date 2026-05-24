const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');
const { createNotification } = require('./notificationModel');
const { findListingById } = require('./listingModel');

const ONE_DAY = 24 * 60 * 60 * 1000;
const MAX_RESERVATION_DAYS = 7;

function reservations() {
  return getDatabase().collection('reservations');
}

function listings() {
  return getDatabase().collection('listings');
}

function publicReservation(reservation, user = null) {
  return {
    ...reservation,
    _id: String(reservation._id),
    listingId: String(reservation.listingId),
    userId: String(reservation.userId),
    ownerId: String(reservation.ownerId),
    canReview: String(reservation.ownerId) === String(user?._id) && reservation.status === 'pending_owner',
    canPay: String(reservation.userId) === String(user?._id) && reservation.status === 'owner_confirmed' && reservation.paymentStatus !== 'paid'
  };
}

async function ensureReservationIndexes() {
  await reservations().createIndex({ userId: 1, createdAt: -1 });
  await reservations().createIndex({ ownerId: 1, createdAt: -1 });
  await reservations().createIndex({ status: 1, paymentStatus: 1 });
  await reservations().createIndex({ reservationEndDate: 1, status: 1, paymentStatus: 1 });
}

function parseDateOnly(value, label) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const error = new Error(`${label} obligatoire`);
    error.status = 400;
    throw error;
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${label} invalide`);
    error.status = 400;
    throw error;
  }

  return { raw, date };
}

function reservationPeriod(body = {}) {
  const start = parseDateOnly(body.reservationStartDate, 'Date de début');
  const end = parseDateOnly(body.reservationEndDate, 'Date de fin');
  const durationDays = Math.floor((end.date.getTime() - start.date.getTime()) / ONE_DAY) + 1;
  const today = new Date(new Date().toISOString().slice(0, 10));

  if (start.date < today) {
    const error = new Error('La date de début ne peut pas être dans le passé');
    error.status = 400;
    throw error;
  }

  if (durationDays < 1) {
    const error = new Error('La date de fin doit être après la date de début');
    error.status = 400;
    throw error;
  }

  if (durationDays > MAX_RESERVATION_DAYS) {
    const error = new Error('La période de réservation ne doit pas dépasser 7 jours');
    error.status = 400;
    throw error;
  }

  return {
    reservationStartDate: start.raw,
    reservationEndDate: end.raw,
    reservationDurationDays: durationDays
  };
}

async function expireExpiredReservations() {
  const today = new Date().toISOString().slice(0, 10);
  const expired = await reservations()
    .find({
      reservationEndDate: { $lt: today },
      paymentStatus: { $ne: 'paid' },
      status: { $in: ['pending_owner', 'owner_confirmed'] }
    })
    .toArray();

  if (!expired.length) return 0;

  const ids = expired.map((reservation) => reservation._id);
  await reservations().updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        status: 'expired',
        expiredAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  await Promise.all(expired.flatMap((reservation) => [
    createNotification({
      userId: reservation.userId,
      type: 'reservation.expired',
      title: 'Réservation annulée',
      message: `Votre réservation de "${reservation.listingTitle}" a été annulée car le délai choisi est dépassé.`,
      metadata: { reservationId: String(reservation._id), listingId: String(reservation.listingId) }
    }),
    createNotification({
      userId: reservation.ownerId,
      type: 'reservation.expired',
      title: 'Réservation annulée',
      message: `La réservation de "${reservation.listingTitle}" demandée par ${reservation.userName} a expiré.`,
      metadata: { reservationId: String(reservation._id), listingId: String(reservation.listingId) }
    })
  ]));

  return expired.length;
}

async function markReservedListingsUnavailable() {
  const listingIds = await reservations().distinct('listingId', {
    status: 'paid',
    paymentStatus: 'paid'
  });
  const validIds = listingIds.filter((id) => ObjectId.isValid(id));
  if (!validIds.length) return 0;

  const result = await listings().updateMany(
    {
      _id: { $in: validIds.map((id) => new ObjectId(id)) },
      propertyType: 'maison'
    },
    {
      $set: {
        isAvailable: false,
        unavailableReason: 'reserved',
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount;
}

async function createReservation(user, body = {}) {
  await expireExpiredReservations();

  if (!body.listingId) {
    const error = new Error('Annonce obligatoire');
    error.status = 400;
    throw error;
  }

  const listing = await findListingById(body.listingId);
  if (!listing) {
    const error = new Error('Annonce introuvable');
    error.status = 404;
    throw error;
  }

  if (listing.dealType !== 'location') {
    const error = new Error('La réservation est disponible uniquement pour les locations');
    error.status = 400;
    throw error;
  }

  if (!listing.ownerId) {
    const error = new Error('Cette annonce ne peut pas encore recevoir de réservation');
    error.status = 400;
    throw error;
  }

  if (String(listing.ownerId) === String(user._id)) {
    const error = new Error('Vous ne pouvez pas réserver votre propre annonce');
    error.status = 400;
    throw error;
  }

  const period = reservationPeriod(body);

  const existing = await reservations().findOne({
    listingId: new ObjectId(listing._id),
    userId: new ObjectId(user._id),
    status: { $in: ['pending_owner', 'owner_confirmed', 'paid'] }
  });
  if (existing) return publicReservation(existing, user);

  const price = Number(listing.price || 0);
  const reservation = {
    listingId: new ObjectId(listing._id),
    listingReference: listing.reference || '',
    listingTitle: listing.title || '',
    listingLocation: listing.location || '',
    rentAmount: price,
    reservationAmount: Math.round(price * 0.1),
    nonRefundableAfterPayment: true,
    ...period,
    userId: new ObjectId(user._id),
    userName: user.name || user.email || 'Client',
    userPhone: user.phone || '',
    ownerId: new ObjectId(listing.ownerId),
    ownerName: listing.ownerName || 'Propriétaire',
    status: 'pending_owner',
    paymentStatus: 'unpaid',
    paymentReference: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await reservations().insertOne(reservation);
  const saved = { ...reservation, _id: result.insertedId };

  await createNotification({
    userId: listing.ownerId,
    actorId: user._id,
    type: 'reservation.requested',
    title: 'Nouvelle demande de réservation',
    message: `${reservation.userName} veut réserver "${reservation.listingTitle}" du ${reservation.reservationStartDate} au ${reservation.reservationEndDate}. Vous devez valider la demande.`,
    metadata: { reservationId: String(saved._id), listingId: String(listing._id) }
  });

  return publicReservation(saved, user);
}

async function listMyReservations(user) {
  await expireExpiredReservations();
  const userId = new ObjectId(user._id);
  const items = await reservations()
    .find({ $or: [{ userId }, { ownerId: userId }] })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return items.map((reservation) => publicReservation(reservation, user));
}

async function updateReservationByOwner(id, owner, status) {
  await expireExpiredReservations();
  const accepted = status === 'confirmed';
  const rejected = status === 'rejected';
  if (!accepted && !rejected) {
    const error = new Error('Statut de réservation invalide');
    error.status = 400;
    throw error;
  }

  const reservation = await reservations().findOne({ _id: new ObjectId(id), ownerId: new ObjectId(owner._id) });
  if (!reservation) return null;
  if (reservation.reservationEndDate < new Date().toISOString().slice(0, 10)) {
    const error = new Error('Cette demande de réservation a expiré');
    error.status = 400;
    throw error;
  }
  if (reservation.status !== 'pending_owner') {
    const error = new Error('Cette demande de réservation est déjà traitée');
    error.status = 400;
    throw error;
  }

  const nextStatus = accepted ? 'owner_confirmed' : 'owner_rejected';
  const result = await reservations().findOneAndUpdate(
    { _id: reservation._id },
    { $set: { status: nextStatus, ownerReviewedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  await listings().updateOne(
    { _id: reservation.listingId, propertyType: 'maison' },
    {
      $set: {
        isAvailable: false,
        unavailableReason: 'reserved',
        updatedAt: new Date()
      }
    }
  );

  await createNotification({
    userId: reservation.userId,
    actorId: owner._id,
    type: accepted ? 'reservation.confirmed' : 'reservation.rejected',
    title: accepted ? 'Réservation acceptée' : 'Réservation refusée',
    message: accepted
      ? `Votre réservation de "${reservation.listingTitle}" est acceptée. Vous pouvez payer ${reservation.reservationAmount} Ar avant le ${reservation.reservationEndDate}. Après paiement, la réservation est actée et le montant n’est pas remboursé si vous ne vous manifestez pas.`
      : `Votre réservation de "${reservation.listingTitle}" a été refusée.`,
    metadata: { reservationId: String(reservation._id), listingId: String(reservation.listingId) }
  });

  return publicReservation(result, owner);
}

async function payReservation(id, user) {
  await expireExpiredReservations();
  const reservation = await reservations().findOne({ _id: new ObjectId(id), userId: new ObjectId(user._id) });
  if (!reservation) return null;
  if (reservation.reservationEndDate < new Date().toISOString().slice(0, 10)) {
    const error = new Error('Cette réservation a expiré');
    error.status = 400;
    throw error;
  }
  if (reservation.status !== 'owner_confirmed') {
    const error = new Error('Le propriétaire doit d’abord accepter la réservation');
    error.status = 400;
    throw error;
  }

  const result = await reservations().findOneAndUpdate(
    { _id: reservation._id },
    {
      $set: {
        status: 'paid',
        paymentStatus: 'paid',
        paymentReference: `RSV-${Date.now()}`,
        nonRefundableAfterPayment: true,
        paidAt: new Date(),
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  await createNotification({
    userId: reservation.ownerId,
    actorId: user._id,
    type: 'reservation.paid',
    title: 'Réservation payée',
    message: `${reservation.userName} a payé ${reservation.reservationAmount} Ar pour réserver "${reservation.listingTitle}". La réservation est actée.`,
    metadata: { reservationId: String(reservation._id), listingId: String(reservation.listingId) }
  });

  return publicReservation(result, user);
}

module.exports = {
  createReservation,
  expireExpiredReservations,
  ensureReservationIndexes,
  listMyReservations,
  markReservedListingsUnavailable,
  payReservation,
  updateReservationByOwner
};
