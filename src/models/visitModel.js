const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');
const { createNotification } = require('./notificationModel');
const { findListingById } = require('./listingModel');
const { findAgentForArrondissement } = require('./userModel');

function visits() {
  return getDatabase().collection('visits');
}

function publicVisit(visit, user = null) {
  const paid = visit.paymentStatus === 'paid';
  const agentPhoneVisible = paid || user?.role === 'agent' || user?.role === 'admin';
  return {
    ...visit,
    _id: String(visit._id),
    listingId: String(visit.listingId),
    userId: String(visit.userId),
    agentId: String(visit.agentId),
    agentPhone: agentPhoneVisible ? visit.agentPhone : ''
  };
}

function publicListingSnapshot(listing) {
  if (!listing) return null;
  return {
    _id: String(listing._id),
    reference: listing.reference || '',
    title: listing.title || '',
    location: listing.location || '',
    arrondissement: listing.arrondissement || null,
    dealType: listing.dealType || '',
    propertyType: listing.propertyType || '',
    price: listing.price || 0,
    bedrooms: listing.bedrooms || 0,
    area: listing.area || 0,
    description: listing.description || '',
    images: Array.isArray(listing.images) ? listing.images : [listing.image].filter(Boolean),
    waterSource: listing.waterSource || '',
    showerLocation: listing.showerLocation || '',
    wcLocation: listing.wcLocation || '',
    hasElectricity: listing.hasElectricity === true,
    hasMotorbikeAccess: listing.hasMotorbikeAccess === true,
    hasCarAccess: listing.hasCarAccess === true,
    mapUrl: listing.mapResolvedUrl || listing.mapUrl || ''
  };
}

async function attachListingDetails(visit, user) {
  const listing = await findListingById(visit.listingId, { includeModeration: true });
  return {
    ...publicVisit(visit, user),
    listing: publicListingSnapshot(listing)
  };
}

async function ensureVisitIndexes() {
  await visits().createIndex({ userId: 1, createdAt: -1 });
  await visits().createIndex({ agentId: 1, createdAt: -1 });
  await visits().createIndex({ status: 1, agentDecisionDueAt: 1 });
}

async function createVisitRequest(user, body = {}) {
  if (!body.listingId || !body.visitDate || !body.visitTime) {
    const error = new Error('Annonce, date et heure de visite sont obligatoires');
    error.status = 400;
    throw error;
  }

  const listing = await findListingById(body.listingId);
  if (!listing) {
    const error = new Error('Annonce introuvable');
    error.status = 404;
    throw error;
  }

  const agent = await findAgentForArrondissement(listing.arrondissement);
  if (!agent) {
    const error = new Error('Aucun agent n’est encore rattaché à cet arrondissement');
    error.status = 400;
    throw error;
  }

  const scheduledAt = new Date(`${body.visitDate}T${body.visitTime}`);
  if (!Number.isFinite(scheduledAt.getTime())) {
    const error = new Error('Date ou heure de visite invalide');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const visit = {
    listingId: new ObjectId(listing._id),
    listingReference: listing.reference || '',
    listingTitle: listing.title || '',
    listingLocation: listing.location || '',
    arrondissement: listing.arrondissement || null,
    userId: new ObjectId(user._id),
    userName: user.name || user.email || 'Client',
    userPhone: user.phone || '',
    agentId: new ObjectId(agent._id),
    agentName: agent.name || 'Agent',
    agentPhone: agent.phone || '',
    visitDate: String(body.visitDate),
    visitTime: String(body.visitTime),
    scheduledAt,
    status: 'pending_agent',
    paymentStatus: 'unpaid',
    paymentReference: '',
    agentDecisionDueAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now
  };

  const result = await visits().insertOne(visit);
  const saved = { ...visit, _id: result.insertedId };

  await createNotification({
    userId: agent._id,
    actorId: user._id,
    type: 'visit.requested',
    title: 'Nouvelle demande de visite',
    message: `${visit.userName} veut visiter "${visit.listingTitle}" le ${visit.visitDate} à ${visit.visitTime}. Validation requise sous 2h.`,
    metadata: { visitId: String(saved._id), listingId: String(listing._id) }
  });

  return publicVisit(saved, user);
}

async function listMyVisits(user) {
  const filter = user.role === 'agent'
    ? { agentId: new ObjectId(user._id) }
    : { userId: new ObjectId(user._id) };
  const items = await visits().find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  if (user.role !== 'agent') return items.map((visit) => publicVisit(visit, user));
  return Promise.all(items.map((visit) => attachListingDetails(visit, user)));
}

async function updateVisitByAgent(id, agent, status) {
  const accepted = status === 'confirmed';
  const rejected = status === 'rejected';
  if (!accepted && !rejected) {
    const error = new Error('Statut de visite invalide');
    error.status = 400;
    throw error;
  }

  const visit = await visits().findOne({ _id: new ObjectId(id), agentId: new ObjectId(agent._id) });
  if (!visit) return null;
  if (new Date() > new Date(visit.agentDecisionDueAt)) {
    const error = new Error('Le délai de validation de 2h est dépassé');
    error.status = 400;
    throw error;
  }

  const nextStatus = accepted ? 'agent_confirmed' : 'agent_rejected';
  const result = await visits().findOneAndUpdate(
    { _id: visit._id },
    { $set: { status: nextStatus, agentReviewedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  await createNotification({
    userId: visit.userId,
    actorId: agent._id,
    type: accepted ? 'visit.confirmed' : 'visit.rejected',
    title: accepted ? 'Visite acceptée' : 'Visite refusée',
    message: accepted
      ? `Votre visite de "${visit.listingTitle}" est acceptée. Vous pouvez régler le droit de visite.`
      : `Votre visite de "${visit.listingTitle}" a été refusée par l’agent.`,
    metadata: { visitId: String(visit._id), listingId: String(visit.listingId) }
  });

  return publicVisit(result, agent);
}

async function payVisit(id, user) {
  const visit = await visits().findOne({ _id: new ObjectId(id), userId: new ObjectId(user._id) });
  if (!visit) return null;
  if (visit.status !== 'agent_confirmed') {
    const error = new Error('Le rendez-vous doit d’abord être confirmé par l’agent');
    error.status = 400;
    throw error;
  }

  const result = await visits().findOneAndUpdate(
    { _id: visit._id },
    {
      $set: {
        paymentStatus: 'paid',
        paymentReference: `PAY-${Date.now()}`,
        paidAt: new Date(),
        status: 'paid',
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  await createNotification({
    userId: visit.agentId,
    actorId: user._id,
    type: 'visit.paid',
    title: 'Droit de visite payé',
    message: `${visit.userName} a réglé le droit de visite pour "${visit.listingTitle}".`,
    metadata: { visitId: String(visit._id), listingId: String(visit.listingId) }
  });

  return publicVisit(result, user);
}

module.exports = {
  createVisitRequest,
  ensureVisitIndexes,
  listMyVisits,
  payVisit,
  updateVisitByAgent
};
