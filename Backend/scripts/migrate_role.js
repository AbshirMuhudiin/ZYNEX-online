import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('Altering users table to support the "staff" role...');
    // Alter ENUM in users table
    await conn.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'user', 'customer', 'staff') NOT NULL DEFAULT 'staff'
    `);

    console.log('Migrating existing "customer" and "user" roles to "staff"...');
    // Update existing records
    const [result] = await conn.query(`
      UPDATE users 
      SET role = 'staff' 
      WHERE role IN ('customer', 'user')
    `);
    console.log(`Migrated ${result.affectedRows} users to "staff".`);

    await conn.commit();
    console.log('Migration completed successfully.');
  } catch (e) {
    await conn.rollback();
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
