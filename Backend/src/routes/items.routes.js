import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', (process.env.UPLOAD_DIR || 'uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

async function createLowStockNotificationIfNeeded(itemId, io) {
  const [[item]] = await pool.query('SELECT id, name, quantity, min_quantity FROM items WHERE id=?', [itemId]);
  if (!item) return;
  if (item.quantity <= item.min_quantity) {
    const message = `Low stock for ${item.name}: ${item.quantity}`;
    const [result] = await pool.query('INSERT INTO notifications (type, message, is_read, created_at) VALUES (?,?,0,NOW())', ['LOW_STOCK', message]);
    io?.to('role:admin').emit('notification', { id: result.insertId, type: 'LOW_STOCK', message });
    io?.to('role:user').emit('notification', { id: result.insertId, type: 'LOW_STOCK', message });
  }
}

router.get('/', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM items ORDER BY id DESC');
  for (const row of rows) {
    const [imgs] = await pool.query('SELECT path FROM item_images WHERE item_id=?', [row.id]);
    row.images = imgs.map(i => i.path);
  }
  res.json(rows);
});

router.post('/', authenticate, authorize(['admin']), upload.array('images', 5), async (req, res) => {
  const { name, sku, description, cost_price, sale_price, quantity, min_quantity } = req.body;
  const files = req.files || [];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO items (name, sku, description, cost_price, sale_price, quantity, min_quantity, created_at) VALUES (?,?,?,?,?,?,?,NOW())',
      [name, sku, description || '', Number(cost_price), Number(sale_price), Number(quantity), Number(min_quantity)]
    );
    const itemId = result.insertId;
    for (const f of files) {
      const relPath = `/uploads/${path.basename(f.path)}`;
      await conn.query('INSERT INTO item_images (item_id, path) VALUES (?,?)', [itemId, relPath]);
    }
    await conn.commit();
    await createLowStockNotificationIfNeeded(itemId, req.app.get('io'));
    res.json({ id: itemId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to create item' });
  } finally {
    conn.release();
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, sku, description, cost_price, sale_price, quantity, min_quantity } = req.body;
  await pool.query(
    'UPDATE items SET name=?, sku=?, description=?, cost_price=?, sale_price=?, quantity=?, min_quantity=? WHERE id=?',
    [name, sku, description || '', Number(cost_price), Number(sale_price), Number(quantity), Number(min_quantity), id]
  );
  await createLowStockNotificationIfNeeded(id, req.app.get('io'));
  res.json({ id: Number(id) });
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM item_images WHERE item_id=?', [id]);
  await pool.query('DELETE FROM items WHERE id=?', [id]);
  res.json({ id: Number(id) });
});

export default router;



