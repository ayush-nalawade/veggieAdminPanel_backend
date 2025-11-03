import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import * as authController from '../controllers/auth';

const router = express.Router();

router.post('/login', authController.adminLogin);
router.get('/me', authenticateToken, requireAdmin, authController.getAdminProfile);

export default router;

