import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
  if (existing.length) return res.status(409).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query('INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,NOW())', [name, email, passwordHash, 'staff']);
  return res.json({ id: result.insertId, name, email, role: 'staff' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT id, name, email, password, role FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id=?', [req.user.id]);
  return res.json(rows[0]);
});

router.patch('/role/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;
  if (!['admin', 'user', 'customer', 'staff'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  await pool.query('UPDATE users SET role=? WHERE id=?', [role, id]);
  return res.json({ id: Number(id), role });
});

export default router;



