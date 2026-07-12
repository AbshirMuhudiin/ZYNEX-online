// migrate_expenses.js – Creates the expenses table
// Usage: node Backend/scripts/migrate_expenses.js

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iftiin',
  });

  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category ENUM('Rent','Salary','Utilities','Transport','Fuel','Office Supplies','Maintenance','Tax','Other') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method ENUM('Cash','Bank','Mobile Money') NOT NULL,
        expense_date DATE NOT NULL,
        receipt_path VARCHAR(512) NOT NULL,
        description TEXT NULL,
        recorded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_expense_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(sql);
    console.log('✅ expenses table created (or already exists)');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
