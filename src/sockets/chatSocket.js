const { Server } = require('socket.io');

const { findUserByToken } = require('../models/userModel');
const { findConversationForUser, listConversations, saveMessage } = require('../models/chatModel');

function setupChatSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = await findUserByToken(token);
      if (!user) {
        next(new Error('Connexion requise'));
        return;
      }

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.user._id}`);
    if (socket.user.role === 'admin') {
      socket.join('support:admins');
    }

    try {
      const conversations = await listConversations(socket.user);
      conversations.forEach((conversation) => socket.join(`conversation:${conversation._id}`));
    } catch (_error) {
      // Les conversations peuvent toujours etre rejointes manuellement ensuite.
    }

    socket.on('chat:join', async ({ conversationId } = {}, ack) => {
      try {
        const conversation = await findConversationForUser(conversationId, socket.user);
        if (!conversation) throw new Error('Conversation introuvable');
        socket.join(`conversation:${conversation._id}`);
        if (ack) ack({ ok: true });
      } catch (error) {
        if (ack) ack({ ok: false, message: error.message });
      }
    });

    socket.on('chat:message', async ({ conversationId, body } = {}, ack) => {
      try {
        const message = await saveMessage(conversationId, socket.user, body);
        const conversation = await findConversationForUser(conversationId, socket.user);
        io.to(`conversation:${conversationId}`).emit('chat:message', message);
        (conversation?.participantIds || []).forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:message', message);
        });
        if (conversation?.type === 'support') {
          io.to('support:admins').emit('chat:message', message);
        }
        if (ack) ack({ ok: true, message });
      } catch (error) {
        if (ack) ack({ ok: false, message: error.message });
      }
    });
  });

  return io;
}

module.exports = { setupChatSocket };
