import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const id = Math.random().toString(36).substring(2, 15);
    const hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    try {
      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [id, name, email.toLowerCase(), hash, now]
      });
      await db.execute({
        sql: 'INSERT INTO user_settings (user_id) VALUES (?)',
        args: [id]
      });

      const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: { id, name, email: email.toLowerCase() }, token });
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('UNIQUE')) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
      throw dbErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await db.execute({
      sql: 'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const row = result.rows[0];
    const match = await bcrypt.compare(password, row[3] as string);
    
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const id = row[0] as string;
    const name = row[1] as string;
    const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: { id, name, email: email.toLowerCase() }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
