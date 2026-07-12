import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
});

router.post('/mark-read', authenticate, authorize(['admin', 'user', 'customer', 'staff']), async (req, res) => {
  const { ids } = req.body; // array of notification ids
  if (!Array.isArray(ids) || ids.length === 0) return res.json({ updated: 0 });
  const [result] = await pool.query(`UPDATE notifications SET is_read=1 WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  res.json({ updated: result.affectedRows });
});

export default router;



