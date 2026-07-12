import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/sales', authenticate, authorize(['admin', 'user', 'customer', 'staff']), async (req, res) => {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push('o.created_at >= ?'); params.push(from); }
  if (to) { where.push('o.created_at <= ?'); params.push(to + ' 23:59:59'); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT 
      COALESCE(SUM(oi.subtotal),0) as total_revenue,
      COALESCE(SUM(oi.cost_price * oi.quantity),0) as total_cost,
      COALESCE(SUM((oi.unit_price - oi.cost_price) * oi.quantity),0) as total_profit
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     ${whereSql}`,
    params
  );
  res.json(rows[0]);
});

router.get('/items', authenticate, authorize(['admin', 'user', 'customer', 'staff']), async (req, res) => {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push('o.created_at >= ?'); params.push(from); }
  if (to) { where.push('o.created_at <= ?'); params.push(to + ' 23:59:59'); }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT i.id, i.name,
      COALESCE(SUM(oi.quantity),0) as units_sold,
      COALESCE(SUM(oi.subtotal),0) as revenue,
      COALESCE(SUM(oi.cost_price * oi.quantity),0) as cost,
      COALESCE(SUM((oi.unit_price - oi.cost_price) * oi.quantity),0) as profit
     FROM items i
     LEFT JOIN (
       SELECT oi.item_id, oi.quantity, oi.subtotal, oi.cost_price, oi.unit_price
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       ${whereSql}
     ) oi ON oi.item_id = i.id
     GROUP BY i.id, i.name
     ORDER BY units_sold DESC, profit DESC`
     , params
  );
  res.json(rows);
});

export default router;



