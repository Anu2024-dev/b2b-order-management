import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import invoiceRoutes from './invoice.routes.js';
import adminRoutes from './admin.routes.js';
import { testConnection } from '../config/db.js';

const router = Router();

// Health Check Endpoint
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbStatus.current_time,
        dbName: dbStatus.db_name,
      },
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message,
      },
    });
  }
});

// Mounted API v1 routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/', invoiceRoutes);
router.use('/admin', adminRoutes);

export default router;
