import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import * as productsController from '../controllers/products';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, productsController.getProducts);
router.get('/:id', authenticateToken, requireAdmin, productsController.getProductById);
router.post('/', authenticateToken, requireAdmin, productsController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, productsController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productsController.deleteProduct);

export default router;

