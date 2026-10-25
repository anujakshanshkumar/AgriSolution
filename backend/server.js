const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const crypto = require('crypto');
const { promisify } = require('util');
const express = require('express');
const cors = require('cors');
const { getUsersCollection } = require('./db');
const scrypt = promisify(crypto.scrypt);

const app = express();
app.use(cors());
app.use(express.json());

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = passwordHash.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(storedKey || '')) return false;
  const derivedKey = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(derivedKey, Buffer.from(storedKey, 'hex'));
}

// POST /api/register { mobile, name, district, password }
app.post('/api/register', async (req, res) => {
  const { mobile, name, district, password } = req.body;
  if (!mobile || typeof name !== 'string' || !name.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'mobile, name, and password required' });
  }

  try {
    const users = await getUsersCollection();
    await users.insertOne({
      mobile: String(mobile),
      name: name.trim(),
      district: district || null,
      passwordHash: await hashPassword(password),
      createdAt: new Date()
    });
    res.json({ success: true, message: 'registered successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'mobile number already registered' });
    }
    if (err.name === 'MongoServerSelectionError' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'MongoDB is not running. Start MongoDB and try again.' });
    }
    res.status(500).json({ error: 'internal error' });
  }
});


// POST /api/login { mobile, password }
app.post('/api/login', async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) return res.status(400).json({ error: 'mobile and password required' });

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ mobile: String(mobile) });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const passwordMatches = user.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : user.password === password;
    if (!passwordMatches) return res.status(401).json({ error: 'invalid password' });

    if (!user.passwordHash) {
      await users.updateOne(
        { _id: user._id },
        { $set: { passwordHash: await hashPassword(password) }, $unset: { password: '' } }
      );
    }

    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      mobile: user.mobile,
      district: user.district,
      message: 'authenticated'
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'MongoServerSelectionError' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'MongoDB is not running. Start MongoDB and try again.' });
    }
    res.status(500).json({ error: 'internal error' });
  }
});

const port = Number(process.env.PORT || 5000);
if (require.main === module) {
  const server = app.listen(port, () => {
    const assignedPort = server.address().port;
    console.log(`Backend listening on port ${assignedPort}`);
  });
}

module.exports = app;
