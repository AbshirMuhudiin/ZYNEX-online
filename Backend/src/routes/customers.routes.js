import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

/**
 * GET /customers
 * Returns all customers with their total outstanding balance
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.created_at,
        COUNT(DISTINCT o.id)                          AS total_orders,
        COALESCE(SUM(o.total_amount), 0)             AS total_billed,
        COALESCE(SUM(o.paid_amount), 0)              AS total_paid,
        COALESCE(SUM(o.remaining_amount), 0)         AS total_remaining
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY total_remaining DESC, c.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load customers' });
  }
});

/**
 * GET /customers/:id
 * Returns single customer with all their orders and payment history
 */
router.get('/:id', async (req, res) => {
  try {
    const [[customer]] = await pool.query('SELECT * FROM customers WHERE id=?', [req.params.id]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const [orders] = await pool.query(`
      SELECT o.*, 
        (SELECT COALESCE(SUM(cp.amount),0) FROM credit_payments cp WHERE cp.order_id = o.id) AS payments_made
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `, [req.params.id]);

    res.json({ ...customer, orders });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load customer' });
  }
});

/**
 * POST /customers/find-or-create
 * Finds customer by phone or creates new one
 */
router.post('/find-or-create', async (req, res) => {
  const { name, phone } = req.body;
  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }
  try {
    const [[existing]] = await pool.query('SELECT * FROM customers WHERE phone=?', [phone.trim()]);
    if (existing) return res.json({ ...existing, created: false });

    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, created_at) VALUES (?,?,NOW())',
      [name.trim(), phone.trim()]
    );
    const [[created]] = await pool.query('SELECT * FROM customers WHERE id=?', [result.insertId]);
    res.json({ ...created, created: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const [[existing]] = await pool.query('SELECT * FROM customers WHERE phone=?', [phone.trim()]);
      return res.json({ ...existing, created: false });
    }
    res.status(500).json({ message: 'Failed to find or create customer' });
  }
});

export default router;
