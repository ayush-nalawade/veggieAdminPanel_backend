import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import * as categoriesController from '../controllers/categories';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, categoriesController.getCategories);
router.get('/:id', authenticateToken, requireAdmin, categoriesController.getCategoryById);
router.post('/', authenticateToken, requireAdmin, categoriesController.createCategory);
router.put('/:id', authenticateToken, requireAdmin, categoriesController.updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, categoriesController.deleteCategory);

export default router;

