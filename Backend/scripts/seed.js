import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import pool from '../src/config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','user','customer','staff') NOT NULL DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      sku VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      quantity INT NOT NULL DEFAULT 0,
      min_quantity INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS item_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      path VARCHAR(255) NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      created_by INT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      item_id INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      message VARCHAR(255) NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

    // Seed admin
    const adminEmail = 'admin@example.com';
    const [existing] = await conn.query('SELECT id FROM users WHERE email=?', [adminEmail]);
    if (!existing.length) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query('INSERT INTO users (name, email, password, role) VALUES (?,?,?,\'admin\')', ['Admin', adminEmail, hash]);
    }

    // Seed a few items
    const [items] = await conn.query('SELECT COUNT(*) as c FROM items');
    if (items[0].c === 0) {
      await conn.query(`INSERT INTO items (name, sku, description, cost_price, sale_price, quantity, min_quantity) VALUES 
        ("Sugar 1kg", "SKU-001", "White sugar", 1.50, 2.00, 50, 10),
        ("Rice 5kg", "SKU-002", "Basmati rice", 7.00, 9.00, 30, 5),
        ("Cooking Oil 1L", "SKU-003", "Sunflower oil", 2.50, 3.50, 20, 5)
      `);
    }

    await conn.commit();
    console.log('Database seeded.');
  } catch (e) {
    await conn.rollback();
    console.error(e);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();


