const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');

function activities() {
  return getDatabase().collection('activities');
}

function toObjectId(value) {
  if (!value) return null;
  return value instanceof ObjectId ? value : new ObjectId(value);
}

async function ensureActivityIndexes() {
  await activities().createIndex({ userId: 1, createdAt: -1 });
  await activities().createIndex({ actorId: 1, createdAt: -1 });
}

async function logUserActivity({ userId, actorId, type, label = '', metadata = {} }) {
  if (!userId || !type) return null;

  const activity = {
    userId: toObjectId(userId),
    actorId: actorId ? toObjectId(actorId) : toObjectId(userId),
    type,
    label: String(label || '').trim(),
    metadata,
    createdAt: new Date()
  };

  const result = await activities().insertOne(activity);
  return { ...activity, _id: result.insertedId };
}

async function listUserActivities(userId, limit = 50) {
  return activities()
    .find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .toArray();
}

module.exports = { ensureActivityIndexes, listUserActivities, logUserActivity };
