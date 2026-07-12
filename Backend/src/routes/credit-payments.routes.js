import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /credit-payments/order/:orderId
 * Get all payments for a specific order
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cp.*, u.name as recorded_by_name
       FROM credit_payments cp
       LEFT JOIN users u ON u.id = cp.created_by
       WHERE cp.order_id = ?
       ORDER BY cp.created_at ASC`,
      [req.params.orderId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load payments' });
  }
});

/**
 * POST /credit-payments
 * Record an additional payment toward a credit sale
 */
router.post('/', async (req, res) => {
  const { order_id, amount, note } = req.body;
  if (!order_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid order_id and amount are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the order row
    const [[order]] = await conn.query(
      'SELECT id, total_amount, paid_amount, remaining_amount, credit_status FROM orders WHERE id=? FOR UPDATE',
      [order_id]
    );
    if (!order) throw new Error('Order not found');
    if (order.credit_status === 'CASH' || order.credit_status === 'PAID') {
      throw new Error('This order has no outstanding balance');
    }

    const payAmt = Number(amount);
    const remaining = Number(order.remaining_amount);

    if (payAmt > remaining) {
      throw new Error(`Payment exceeds remaining balance of $${remaining.toFixed(2)}`);
    }

    const newPaid      = Number(order.paid_amount) + payAmt;
    const newRemaining = remaining - payAmt;
    const newStatus    = newRemaining <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'UNPAID');

    // Update order
    await conn.query(
      'UPDATE orders SET paid_amount=?, remaining_amount=?, credit_status=? WHERE id=?',
      [newPaid, newRemaining, newStatus, order_id]
    );

    // Record payment
    await conn.query(
      'INSERT INTO credit_payments (order_id, amount, note, created_by, created_at) VALUES (?,?,?,?,NOW())',
      [order_id, payAmt, note || null, req.user.id]
    );

    await conn.commit();
    res.json({
      order_id,
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      credit_status: newStatus,
      message: newStatus === 'PAID' ? 'Balance fully settled! ✅' : `Payment recorded. Remaining: $${newRemaining.toFixed(2)}`
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ message: e.message || 'Payment failed' });
  } finally {
    conn.release();
  }
});

/**
 * POST /credit-payments/extend-due-date
 * Extend the due date of a credit sale
 */
router.post('/extend-due-date', authorize(['admin']), async (req, res) => {
  const { order_id, new_due_date } = req.body;
  if (!order_id || !new_due_date) {
    return res.status(400).json({ message: 'Order ID and new due date are required' });
  }

  try {
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id=?', [order_id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    await pool.query('UPDATE orders SET due_date=? WHERE id=?', [new_due_date, order_id]);
    res.json({ message: 'Due date extended successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to extend due date' });
  }
});

export default router;
