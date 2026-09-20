require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// POST /api/register { mobile, name, district, password }
app.post('/api/register', async (req, res) => {
  const { mobile, name, district, password } = req.body;
  if (!mobile || !name || !password) return res.status(400).json({ error: 'mobile, name, and password required' });

  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO users (mobile, name, district, password, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), district = VALUES(district), password = VALUES(password)`,
        [mobile, name, district || null, password]
      );
      res.json({ success: true, message: 'registered successfully' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'mobile number already registered' });
    }
    res.status(500).json({ error: 'internal error' });
  }
});


// POST /api/login { mobile, password }
app.post('/api/login', async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) return res.status(400).json({ error: 'mobile and password required' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, password FROM users WHERE mobile = ?', [mobile]);
      if (!rows.length) return res.status(404).json({ error: 'user not found' });

      const user = rows[0];
      if (user.password !== password) return res.status(401).json({ error: 'invalid password' });

      res.json({ success: true, userId: user.id, name: user.name, message: 'authenticated' });
    } finally { conn.release(); }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
