import { Router } from 'express';
import authRoutes from './auth.routes.js';
import itemsRoutes from './items.routes.js';
import ordersRoutes from './orders.routes.js';
import notificationsRoutes from './notifications.routes.js';
import reportsRoutes from './reports.routes.js';
import usersRoutes from './users.routes.js';
import customersRoutes from './customers.routes.js';
import creditPaymentsRoutes from './credit-payments.routes.js';
import expensesRoutes from './expenses.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemsRoutes);
router.use('/orders', ordersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reports', reportsRoutes);
router.use('/users', usersRoutes);
router.use('/customers', customersRoutes);
router.use('/credit-payments', creditPaymentsRoutes);
router.use('/expenses', expensesRoutes);

export default router;
