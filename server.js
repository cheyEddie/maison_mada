require('dotenv').config();

const http = require('http');

const { createApp } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { ensureActivityIndexes } = require('./src/models/activityModel');
const { ensureChatIndexes } = require('./src/models/chatModel');
const { ensureNotificationIndexes } = require('./src/models/notificationModel');
const {
  ensureDescriptions,
  ensureAvailabilityFields,
  ensureImageArrays,
  ensureListingIndexes,
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
  await Promise.all([ensureListingIndexes(), ensureUserIndexes(), ensureActivityIndexes(), ensureChatIndexes(), ensureNotificationIndexes()]);
  await seedListingsIfEmpty();
  await ensureReferences();
  await ensureReferenceFormat();
  await ensureDescriptions();
  await ensureAvailabilityFields();
  await ensureImageArrays();
  await ensureOwnerPhones();
  await ensureListingStatuses();
  await ensureUtilityFields();
  await removeDeprecatedFields();
  await ensureUserRoles();
  await ensureAdminUser();
  await ensureUserReferences();

  const app = createApp();
  const server = http.createServer(app);
  setupChatSocket(server);
  server.listen(port, () => {
    console.log(`MaisonMada disponible sur http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Impossible de demarrer MaisonMada:', error.message);
  process.exit(1);
});
