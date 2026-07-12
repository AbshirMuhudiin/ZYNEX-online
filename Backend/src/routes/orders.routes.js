import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

// Get single order with its items and payment history
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const [[order]] = await pool.query('SELECT * FROM orders WHERE id=?', [id]);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const [orderItems] = await pool.query(
    `SELECT oi.*, i.name as item_name, i.sku
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id = ?`,
    [id]
  );

  const [payments] = await pool.query(
    `SELECT cp.*, u.name as recorded_by_name
     FROM credit_payments cp
     LEFT JOIN users u ON u.id = cp.created_by
     WHERE cp.order_id = ?
     ORDER BY cp.created_at ASC`,
    [id]
  );

  res.json({ ...order, items: orderItems, payment_history: payments });
});

/**
 * POST /orders
 * Handles both cash sales and credit sales.
 * - paid_amount = total → cash sale, no customer required
 * - paid_amount < total → credit sale, customer_id required (use /customers/find-or-create first)
 */
router.post('/', authenticate, authorize(['admin', 'user', 'customer', 'staff']), async (req, res) => {
  const { customer_id, customer_name, paid_amount, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    let totalCost   = 0;

    // Validate stock and compute totals
    for (const it of items) {
      const [[dbItem]] = await conn.query(
        'SELECT id, cost_price, sale_price, quantity FROM items WHERE id=? FOR UPDATE',
        [it.item_id]
      );
      if (!dbItem) throw new Error(`Item #${it.item_id} not found`);
      if (dbItem.quantity < it.quantity) throw new Error(`Insufficient stock for "${dbItem.name}"`);

      totalAmount += Number(it.unit_price) * Number(it.quantity);
      totalCost   += Number(dbItem.cost_price) * Number(it.quantity);
      await conn.query('UPDATE items SET quantity=quantity-? WHERE id=?', [it.quantity, it.item_id]);
    }

    const paidAmt    = Math.min(Number(paid_amount ?? totalAmount), totalAmount);
    const remaining  = totalAmount - paidAmt;

    // Determine credit status
    let creditStatus = 'CASH';
    if (paidAmt < totalAmount) {
      creditStatus = paidAmt === 0 ? 'UNPAID' : 'PARTIAL';
    }

    // For credit sales, customer_id is required
    if (creditStatus !== 'CASH' && !customer_id) {
      throw new Error('Customer is required for credit sales');
    }

    // Insert order
    const due_date = creditStatus !== 'CASH' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
    
    const [orderRes] = await conn.query(
      `INSERT INTO orders
         (customer_id, customer_name, created_by, total_amount, paid_amount, remaining_amount, credit_status, due_date, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
      [
        customer_id || null,
        customer_name || 'Walk-in Customer',
        req.user.id,
        totalAmount,
        paidAmt,
        remaining,
        creditStatus,
        due_date,
        'CREATED',
      ]
    );
    const orderId = orderRes.insertId;

    // Insert order items
    for (const it of items) {
      const [[dbItem]] = await conn.query('SELECT cost_price FROM items WHERE id=?', [it.item_id]);
      const subtotal = Number(it.unit_price) * Number(it.quantity);
      await conn.query(
        'INSERT INTO order_items (order_id, item_id, unit_price, cost_price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
        [orderId, it.item_id, it.unit_price, dbItem.cost_price, it.quantity, subtotal]
      );
    }

    await conn.commit();
    res.json({
      id: orderId,
      total_amount: totalAmount,
      paid_amount: paidAmt,
      remaining_amount: remaining,
      credit_status: creditStatus,
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ message: e.message || 'Order failed' });
  } finally {
    conn.release();
  }
});

export default router;
