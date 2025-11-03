import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import * as ordersController from '../controllers/orders';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, ordersController.getAllOrders);
router.get('/stats', authenticateToken, requireAdmin, ordersController.getOrderStats);
router.get('/:id', authenticateToken, requireAdmin, ordersController.getOrderById);
router.patch('/:id/status', authenticateToken, requireAdmin, ordersController.updateOrderStatus);

export default router;

