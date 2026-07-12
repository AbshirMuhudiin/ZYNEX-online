import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import pool from './config/db.js';

// --- Background Job: Overdue Debt Notifications ---
const checkOverdueDebts = async () => {
  try {
    const [overdue] = await pool.query(
      `SELECT o.id, o.customer_name, o.due_date 
       FROM orders o 
       WHERE o.due_date IS NOT NULL 
         AND o.due_date < CURDATE() 
         AND o.credit_status IN ('PARTIAL', 'UNPAID')
         AND o.id NOT IN (
           SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.order_id')) 
           FROM notifications 
           WHERE message LIKE 'Overdue debt%' 
             AND created_at >= CURDATE()
         )`
    );

    for (let order of overdue) {
      const msg = `Overdue debt alert! ${order.customer_name} has an overdue payment for Order #${order.id} (Due: ${new Date(order.due_date).toLocaleDateString()}).`;
      await pool.query(
        'INSERT INTO notifications (message, data) VALUES (?, ?)',
        [msg, JSON.stringify({ order_id: order.id, type: 'overdue' })]
      );
    }
  } catch (error) {
    console.error('Error checking overdue debts:', error);
  }
};
// Run on startup and every 12 hours
checkOverdueDebts();
setInterval(checkOverdueDebts, 12 * 60 * 60 * 1000);
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // Join rooms by role or user id if provided
  socket.on('join', ({ role, userId }) => {
    if (role) socket.join(`role:${role}`);
    if (userId) socket.join(`user:${userId}`);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});







