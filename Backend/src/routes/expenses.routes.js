import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// ─── Multer Setup ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const receiptsDir = path.join(__dirname, '..', '..', (process.env.UPLOAD_DIR || 'uploads'), 'receipts');

// Ensure receipts directory exists
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP and PDF are allowed.'));
    }
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function removeFile(filePath) {
  try {
    const abs = path.join(__dirname, '..', '..', filePath.replace(/^\//, ''));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) { /* silent */ }
}

// ─── GET /expenses ─── list with optional filters ────────────────────────────
router.get('/', authenticate, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const { category, payment_method, from, to } = req.query;
    const where = [];
    const params = [];

    if (category) { where.push('e.category = ?'); params.push(category); }
    if (payment_method) { where.push('e.payment_method = ?'); params.push(payment_method); }
    if (from) { where.push('e.expense_date >= ?'); params.push(from); }
    if (to) { where.push('e.expense_date <= ?'); params.push(to); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT e.*, u.name AS recorded_by_name
       FROM expenses e
       LEFT JOIN users u ON u.id = e.recorded_by
       ${whereSql}
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// ─── GET /expenses/summary ─── totals for dashboard ─────────────────────────
router.get('/summary', authenticate, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const [today] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE DATE(expense_date) = CURDATE()`
    );
    const [week] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
    );
    const [month] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE MONTH(expense_date)=MONTH(CURDATE()) AND YEAR(expense_date)=YEAR(CURDATE())`
    );
    const [year] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE YEAR(expense_date)=YEAR(CURDATE())`
    );
    const [byCategory] = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) AS total FROM expenses GROUP BY category ORDER BY total DESC`
    );

    res.json({
      today: Number(today[0].total),
      week: Number(week[0].total),
      month: Number(month[0].total),
      year: Number(year[0].total),
      byCategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expense summary' });
  }
});

// ─── GET /expenses/:id ─── single expense ───────────────────────────────────
router.get('/:id', authenticate, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS recorded_by_name
       FROM expenses e
       LEFT JOIN users u ON u.id = e.recorded_by
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Expense not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expense' });
  }
});

// ─── POST /expenses ─── create ───────────────────────────────────────────────
router.post('/', authenticate, authorize(['admin', 'staff']), upload.single('receipt'), async (req, res) => {
  try {
    const { title, category, amount, payment_method, expense_date, description } = req.body;

    // Validate required fields
    if (!title || !category || !amount || !payment_method || !expense_date) {
      if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
      return res.status(400).json({ message: 'Title, category, amount, payment method, and date are required.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Receipt upload is required.' });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      removeFile(`/uploads/receipts/${req.file.filename}`);
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const receiptPath = `/uploads/receipts/${req.file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO expenses (title, category, amount, payment_method, expense_date, receipt_path, description, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category,
        Number(amount),
        payment_method,
        expense_date,
        receiptPath,
        description?.trim() || null,
        req.user.id,
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Expense created successfully' });
  } catch (err) {
    console.error(err);
    if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
    res.status(500).json({ message: 'Failed to create expense' });
  }
});

// ─── PUT /expenses/:id ─── update ───────────────────────────────────────────
router.put('/:id', authenticate, authorize(['admin', 'staff']), upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, payment_method, expense_date, description } = req.body;

    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing.length) {
      if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (!title || !category || !amount || !payment_method || !expense_date) {
      if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
      return res.status(400).json({ message: 'Title, category, amount, payment method, and date are required.' });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    let receiptPath = existing[0].receipt_path;

    // If new file uploaded, replace old one
    if (req.file) {
      removeFile(receiptPath);
      receiptPath = `/uploads/receipts/${req.file.filename}`;
    }

    await pool.query(
      `UPDATE expenses SET title=?, category=?, amount=?, payment_method=?, expense_date=?, receipt_path=?, description=?
       WHERE id=?`,
      [title.trim(), category, Number(amount), payment_method, expense_date, receiptPath, description?.trim() || null, id]
    );

    res.json({ id: Number(id), message: 'Expense updated successfully' });
  } catch (err) {
    console.error(err);
    if (req.file) removeFile(`/uploads/receipts/${req.file.filename}`);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// ─── DELETE /expenses/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Expense not found' });

    // Remove receipt file
    removeFile(existing[0].receipt_path);

    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ id: Number(id), message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

// ─── Multer error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
  }
  res.status(400).json({ message: err.message || 'Upload error' });
});

export default router;
