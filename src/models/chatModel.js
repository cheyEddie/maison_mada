const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');

function conversations() {
  return getDatabase().collection('chat_conversations');
}

function messages() {
  return getDatabase().collection('chat_messages');
}

function users() {
  return getDatabase().collection('users');
}

function publicChatUser(user) {
  return {
    _id: String(user._id),
    name: user.name || user.email || 'Utilisateur',
    role: user.role || 'user'
  };
}

function normalizeId(id) {
  return String(id || '');
}

function sortedParticipantIds(ids) {
  return [...new Set(ids.map(normalizeId).filter(Boolean))].sort();
}

async function ensureChatIndexes() {
  await conversations().createIndex({ type: 1, participantIds: 1, updatedAt: -1 });
  await conversations().createIndex({ type: 1, supportUserId: 1 }, { unique: true, sparse: true });
  await conversations().createIndex({ directKey: 1 }, { unique: true, sparse: true });
  await messages().createIndex({ conversationId: 1, createdAt: 1 });
}

async function hydrateParticipants(ids) {
  const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const found = await users()
    .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1, role: 1 } })
    .toArray();
  const byId = new Map(found.map((user) => [String(user._id), publicChatUser(user)]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

function isConversationUnread(conversation, user) {
  if (!conversation.lastMessageAt) return false;
  if (String(conversation.lastSenderId || '') === String(user._id)) return false;
  if (user.role === 'admin' && conversation.type === 'support' && conversation.lastSenderRole === 'admin') return false;

  const readAt = conversation.readBy?.[String(user._id)];
  return !readAt || new Date(readAt) < new Date(conversation.lastMessageAt);
}

async function formatConversation(conversation, user) {
  const participantIds = conversation.participantIds || [];
  return {
    ...conversation,
    _id: String(conversation._id),
    participantIds,
    participants: await hydrateParticipants(participantIds),
    unread: isConversationUnread(conversation, user)
  };
}

async function findConversationForUser(id, user) {
  if (!ObjectId.isValid(id)) return null;
  const conversation = await conversations().findOne({ _id: new ObjectId(id) });
  if (!conversation) return null;

  const isParticipant = (conversation.participantIds || []).includes(String(user._id));
  const isSupportAdmin = user.role === 'admin' && conversation.type === 'support';
  return isParticipant || isSupportAdmin ? conversation : null;
}

async function listConversations(user) {
  const filter = user.role === 'admin'
    ? { $or: [{ participantIds: String(user._id), type: { $ne: 'support' } }, { type: 'support', supportUserId: { $ne: String(user._id) } }] }
    : { participantIds: String(user._id) };

  const items = await conversations()
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();

  return Promise.all(items.map((conversation) => formatConversation(conversation, user)));
}

async function createDirectConversation(user, recipientId, listingId = '') {
  if (!ObjectId.isValid(recipientId)) {
    const error = new Error('Destinataire introuvable');
    error.status = 404;
    throw error;
  }

  const recipient = await users().findOne({ _id: new ObjectId(recipientId) });
  if (!recipient) {
    const error = new Error('Destinataire introuvable');
    error.status = 404;
    throw error;
  }

  if (String(recipient._id) === String(user._id)) {
    const error = new Error('Vous ne pouvez pas discuter avec vous-meme');
    error.status = 400;
    throw error;
  }

  const participantIds = sortedParticipantIds([user._id, recipient._id]);
  const directKey = participantIds.join(':');
  const now = new Date();
  await conversations().updateOne(
    { directKey },
    {
      $setOnInsert: {
        type: 'direct',
        directKey,
        participantIds,
        listingId: String(listingId || ''),
        createdAt: now
      },
      $set: { updatedAt: now }
    },
    { upsert: true }
  );

  return formatConversation(await conversations().findOne({ directKey }), user);
}

async function createSupportConversation(user) {
  const now = new Date();
  const supportUserId = String(user._id);
  await conversations().updateOne(
    { type: 'support', supportUserId },
    {
      $setOnInsert: {
        type: 'support',
        supportUserId,
        participantIds: [supportUserId],
        createdAt: now
      },
      $set: { updatedAt: now }
    },
    { upsert: true }
  );

  return formatConversation(await conversations().findOne({ type: 'support', supportUserId }), user);
}

async function listMessages(conversationId, user) {
  const conversation = await findConversationForUser(conversationId, user);
  if (!conversation) {
    const error = new Error('Conversation introuvable');
    error.status = 404;
    throw error;
  }

  await conversations().updateOne(
    { _id: conversation._id },
    { $set: { [`readBy.${String(user._id)}`]: new Date() } }
  );

  return messages()
    .find({ conversationId: String(conversation._id) })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();
}

async function saveMessage(conversationId, user, body) {
  const conversation = await findConversationForUser(conversationId, user);
  if (!conversation) {
    const error = new Error('Conversation introuvable');
    error.status = 404;
    throw error;
  }

  const text = String(body || '').trim();
  if (!text) {
    const error = new Error('Message vide');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const message = {
    conversationId: String(conversation._id),
    senderId: String(user._id),
    senderName: user.name || user.email || 'Utilisateur',
    senderRole: user.role || 'user',
    body: text.slice(0, 1200),
    createdAt: now
  };

  const result = await messages().insertOne(message);
  const update = {
    $set: {
        lastMessage: message.body,
        lastMessageAt: now,
        lastSenderId: message.senderId,
        lastSenderRole: message.senderRole,
        [`readBy.${message.senderId}`]: now,
        updatedAt: now
    }
  };
  if (user.role === 'admin' && conversation.type === 'support') {
    update.$addToSet = { participantIds: String(user._id) };
  }

  await conversations().updateOne({ _id: conversation._id }, update);

  return { ...message, _id: String(result.insertedId) };
}

module.exports = {
  createDirectConversation,
  createSupportConversation,
  ensureChatIndexes,
  findConversationForUser,
  listConversations,
  listMessages,
  saveMessage
};
