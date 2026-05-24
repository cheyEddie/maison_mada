require('dotenv').config();

const http = require('http');

const { createApp } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { ensureActivityIndexes } = require('./src/models/activityModel');
const { ensureChatIndexes } = require('./src/models/chatModel');
const { ensureNotificationIndexes } = require('./src/models/notificationModel');
const { ensureReservationIndexes, expireExpiredReservations, markReservedListingsUnavailable } = require('./src/models/reservationModel');
const { ensureVisitIndexes } = require('./src/models/visitModel');
const {
  ensureDescriptions,
  ensureAvailabilityFields,
  ensureImageArrays,
  ensureListingArrondissements,
  ensureListingIndexes,
  ensureListingMapEmbeds,
  ensureOwnerPhones,
  ensureReferenceFormat,
  ensureReferences,
  ensureListingStatuses,
  ensureUtilityFields,
  removeDeprecatedFields,
  seedListingsIfEmpty
} = require('./src/models/listingModel');
const { ensureAdminUser, ensureUserIndexes, ensureUserReferences, ensureUserRoles } = require('./src/models/userModel');
const { setupChatSocket } = require('./src/sockets/chatSocket');

const port = Number(process.env.PORT || 3000);

async function start() {
  await connectDatabase();
  await Promise.all([ensureListingIndexes(), ensureUserIndexes(), ensureActivityIndexes(), ensureChatIndexes(), ensureNotificationIndexes(), ensureReservationIndexes(), ensureVisitIndexes()]);
  await seedListingsIfEmpty();
  await ensureReferences();
  await ensureReferenceFormat();
  await ensureDescriptions();
  await ensureAvailabilityFields();
  await ensureImageArrays();
  await ensureOwnerPhones();
  await ensureListingStatuses();
  await ensureUtilityFields();
  await ensureListingArrondissements();
  await ensureListingMapEmbeds();
  await removeDeprecatedFields();
  await ensureUserRoles();
  await ensureAdminUser();
  await ensureUserReferences();
  await expireExpiredReservations();
  await markReservedListingsUnavailable();

  const app = createApp();
  const server = http.createServer(app);
  setupChatSocket(server);
  server.listen(port, () => {
    console.log(`MaisonMada disponible sur http://localhost:${port}`);
  });
  setInterval(() => {
    expireExpiredReservations().catch((error) => {
      console.error('Impossible d’expirer les reservations:', error.message);
    });
  }, 60 * 60 * 1000);
}

start().catch((error) => {
  console.error('Impossible de demarrer MaisonMada:', error.message);
  process.exit(1);
});
