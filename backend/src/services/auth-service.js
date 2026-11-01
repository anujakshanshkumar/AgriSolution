const crypto = require('crypto');
const { promisify } = require('util');
const { getUsersCollection } = require('../infrastructure/user-repository');
const AppError = require('../errors/app-error');

const scrypt = promisify(crypto.scrypt);
const PASSWORD_HASH_BYTES = 64;

function validateMobile(mobile) {
  if (typeof mobile !== 'string' && typeof mobile !== 'number') {
    throw new AppError(400, 'mobile is required');
  }

  const normalizedMobile = String(mobile).trim();
  if (!normalizedMobile || normalizedMobile.length > 32) {
    throw new AppError(400, 'mobile must be between 1 and 32 characters');
  }
  return normalizedMobile;
}

function validatePassword(password) {
  if (typeof password !== 'string' || !password || password.length > 1024) {
    throw new AppError(400, 'password must be between 1 and 1024 characters');
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, PASSWORD_HASH_BYTES);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  if (typeof passwordHash !== 'string') return false;

  const [salt, storedKey] = passwordHash.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(storedKey || '')) return false;

  const derivedKey = await scrypt(password, salt, PASSWORD_HASH_BYTES);
  return crypto.timingSafeEqual(derivedKey, Buffer.from(storedKey, 'hex'));
}

async function register({ mobile, name, district, password }) {
  const normalizedMobile = validateMobile(mobile);
  validatePassword(password);

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    throw new AppError(400, 'name is required and must be at most 120 characters');
  }
  if (district != null && typeof district !== 'string') {
    throw new AppError(400, 'district must be a string');
  }

  const users = await getUsersCollection();
  await users.insertOne({
    mobile: normalizedMobile,
    name: name.trim(),
    district: typeof district === 'string' && district.trim() ? district.trim() : null,
    passwordHash: await hashPassword(password),
    createdAt: new Date()
  });

  return { success: true, message: 'registered successfully' };
}

async function login({ mobile, password }) {
  const normalizedMobile = validateMobile(mobile);
  validatePassword(password);

  const users = await getUsersCollection();
  const user = await users.findOne({ mobile: normalizedMobile });
  if (!user) throw new AppError(404, 'user not found');

  const passwordMatches = user.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : user.password === password;
  if (!passwordMatches) throw new AppError(401, 'invalid password');

  if (!user.passwordHash) {
    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: await hashPassword(password) }, $unset: { password: '' } }
    );
  }

  return {
    success: true,
    userId: user._id,
    name: user.name,
    mobile: user.mobile,
    district: user.district,
    message: 'authenticated'
  };
}

module.exports = { login, register, hashPassword, verifyPassword, validatePassword };
