const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'maison_mada';

let client;
let db;

async function connectDatabase() {
  if (db) return db;

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName);

  return db;
}

function getDatabase() {
  if (!db) throw new Error('MongoDB n est pas connecte');
  return db;
}

async function closeDatabase() {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
}

module.exports = {
  closeDatabase,
  connectDatabase,
  getDatabase
};
