const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');

function notifications() {
  return getDatabase().collection('notifications');
}

async function ensureNotificationIndexes() {
  await notifications().createIndex({ userId: 1, createdAt: -1 });
  await notifications().createIndex({ userId: 1, readAt: 1 });
}

async function createNotification({ userId, actorId = null, type = 'admin.message', title, message, metadata = {} }) {
  if (!userId) return null;

  const notification = {
    userId: String(userId),
    actorId: actorId ? String(actorId) : null,
    type,
    title: String(title || '').trim(),
    message: String(message || '').trim(),
    metadata,
    readAt: null,
    createdAt: new Date()
  };

  if (!notification.title || !notification.message) return null;
  const result = await notifications().insertOne(notification);
  return { ...notification, _id: String(result.insertedId) };
}

async function listNotifications(userId, limit = 50) {
  const cleanLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  return notifications()
    .find({ userId: String(userId) })
    .sort({ createdAt: -1 })
    .limit(cleanLimit)
    .toArray();
}

async function markNotificationsRead(userId) {
  await notifications().updateMany(
    { userId: String(userId), readAt: null },
    { $set: { readAt: new Date() } }
  );
}

module.exports = {
  createNotification,
  ensureNotificationIndexes,
  listNotifications,
  markNotificationsRead
};
