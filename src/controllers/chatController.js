const {
  createDirectConversation,
  createSupportConversation,
  listConversations,
  listMessages
} = require('../models/chatModel');

async function conversationsIndex(req, res, next) {
  try {
    res.json(await listConversations(req.user));
  } catch (error) {
    next(error);
  }
}

async function directStore(req, res, next) {
  try {
    res.status(201).json(await createDirectConversation(req.user, req.body.recipientId, req.body.listingId));
  } catch (error) {
    next(error);
  }
}

async function supportStore(req, res, next) {
  try {
    res.status(201).json(await createSupportConversation(req.user));
  } catch (error) {
    next(error);
  }
}

async function messagesIndex(req, res, next) {
  try {
    res.json(await listMessages(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  conversationsIndex,
  directStore,
  messagesIndex,
  supportStore
};
