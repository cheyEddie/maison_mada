const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const { getDatabase } = require('../config/database');

function users() {
  return getDatabase().collection('users');
}

function sessions() {
  return getDatabase().collection('sessions');
}

function publicUser(user) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'user',
    accountType: user.accountType || 'particulier',
    identityVerified: user.role === 'admin' || user.identityVerified === true,
    identityVerification: user.identityVerification || { status: user.identityVerified ? 'approved' : 'none' },
    reference: user.reference || '',
    createdAt: user.createdAt
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;

  const candidate = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

function createUserReference() {
  return `MM-USR-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function ensureUserIndexes() {
  await users().createIndex({ email: 1 }, { unique: true });
  await users().createIndex({ reference: 1 }, { unique: true, sparse: true });
  await sessions().createIndex({ token: 1 }, { unique: true });
  await sessions().createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
}

async function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  await sessions().insertOne({
    token,
    userId: user._id,
    createdAt: new Date()
  });

  return token;
}

async function registerUser(body) {
  if (!body.name || !body.email || !body.password) {
    const error = new Error('Nom, email et mot de passe sont obligatoires');
    error.status = 400;
    throw error;
  }

  const user = {
    name: String(body.name).trim(),
    email: normalizeEmail(body.email),
    phone: String(body.phone || '').trim(),
    accountType: body.accountType === 'agence' ? 'agence' : 'particulier',
    identityVerified: false,
    reference: createUserReference(),
    passwordHash: hashPassword(body.password),
    role: 'user',
    createdAt: new Date()
  };

  try {
    while (await users().findOne({ reference: user.reference })) {
      user.reference = createUserReference();
    }

    const result = await users().insertOne(user);
    const savedUser = { ...user, _id: result.insertedId };
    return {
      token: await createSession(savedUser),
      user: publicUser(savedUser)
    };
  } catch (error) {
    if (error.code === 11000) {
      error.status = 409;
      error.message = 'Cet email est deja utilise';
    }
    throw error;
  }
}

async function loginUser(body) {
  const user = await users().findOne({ email: normalizeEmail(body.email) });
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    const error = new Error('Email ou mot de passe incorrect');
    error.status = 401;
    throw error;
  }

  return {
    token: await createSession(user),
    user: publicUser(user)
  };
}

async function findUserByToken(token) {
  if (!token) return null;

  const session = await sessions().findOne({ token });
  if (!session) return null;

  const user = await users().findOne({ _id: new ObjectId(session.userId) });
  return user ? publicUser(user) : null;
}

async function ensureAdminUser() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const existing = await users().findOne({ email });
  if (existing) {
    await users().updateOne(
      { _id: existing._id },
      { $set: { role: 'admin', updatedAt: new Date() } }
    );
    return;
  }

  const admin = {
    name: process.env.ADMIN_NAME || 'Administrateur',
    email,
    phone: '',
    reference: createUserReference(),
    passwordHash: hashPassword(password),
    role: 'admin',
    identityVerified: true,
    createdAt: new Date()
  };

  while (await users().findOne({ reference: admin.reference })) {
    admin.reference = createUserReference();
  }

  await users().insertOne(admin);
}

async function ensureUserRoles() {
  await users().updateMany(
    { role: { $exists: false } },
    { $set: { role: 'user' } }
  );

  await users().updateMany(
    { accountType: { $exists: false } },
    { $set: { accountType: 'particulier' } }
  );

  await users().updateMany(
    { identityVerified: { $exists: false } },
    { $set: { identityVerified: true } }
  );

  await users().updateMany(
    { role: 'admin', identityVerified: { $ne: true } },
    { $set: { identityVerified: true } }
  );
}

async function ensureUserReferences() {
  const cursor = users().find({
    $or: [
      { reference: { $exists: false } },
      { reference: '' },
      { reference: null },
      { reference: { $not: /^MM-USR-\d+$/ } }
    ]
  });

  for await (const user of cursor) {
    let reference = createUserReference();
    while (await users().findOne({ reference })) {
      reference = createUserReference();
    }

    await users().updateOne(
      { _id: user._id },
      { $set: { reference } }
    );
  }
}

async function listUsers() {
  return users()
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ role: 1, createdAt: -1 })
    .toArray();
}

async function updateUserAsAdmin(id, body = {}) {
  const nextAccountType = body.accountType === 'agence' ? 'agence' : body.accountType === 'particulier' ? 'particulier' : null;
  const user = await users().findOne({ _id: new ObjectId(id) });
  if (!user) return null;

  const protectedAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const protectedAdmin = user.role === 'admin' || (protectedAdminEmail && user.email === protectedAdminEmail);
  if (protectedAdmin && (body.role === 'user' || nextAccountType)) {
    const error = new Error('Impossible de modifier un compte administrateur protege');
    error.status = 403;
    throw error;
  }

  const update = { updatedAt: new Date() };
  if (body.role !== undefined) update.role = body.role === 'admin' ? 'admin' : 'user';
  if (nextAccountType) update.accountType = nextAccountType;
  if (body.identityVerified !== undefined) update.identityVerified = body.identityVerified === true;
  if (update.role === 'admin') update.identityVerified = true;
  if (body.identityVerified !== undefined) {
    update['identityVerification.status'] = body.identityVerified === true ? 'approved' : 'rejected';
    update['identityVerification.reviewedAt'] = new Date();
  }

  const result = await users().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  );
  return result;
}

async function deleteUser(id) {
  const userId = new ObjectId(id);
  const user = await users().findOne({ _id: userId });

  if (!user) {
    return { deletedCount: 0 };
  }

  if (user.role === 'admin') {
    const error = new Error('Impossible de supprimer un compte administrateur');
    error.status = 403;
    throw error;
  }

  await sessions().deleteMany({ userId });
  return users().deleteOne({ _id: userId });
}

async function logoutUser(token) {
  if (!token) return;
  await sessions().deleteOne({ token });
}

async function submitIdentityVerification(userId, body = {}, files = []) {
  if (!files.length) {
    const error = new Error('Ajoutez au moins un document');
    error.status = 400;
    throw error;
  }

  const documents = files.map((file) => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    uploadedAt: new Date()
  }));

  const payload = {
    identityVerified: false,
    identityVerification: {
      status: 'pending',
      fullName: String(body.fullName || '').trim(),
      documentType: String(body.documentType || '').trim(),
      note: String(body.note || '').trim(),
      documents,
      submittedAt: new Date()
    },
    updatedAt: new Date()
  };

  const result = await users().findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: payload },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  );

  return publicUser(result);
}

module.exports = {
  deleteUser,
  ensureAdminUser,
  ensureUserIndexes,
  ensureUserReferences,
  ensureUserRoles,
  findUserByToken,
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  submitIdentityVerification,
  updateUserAsAdmin
};
