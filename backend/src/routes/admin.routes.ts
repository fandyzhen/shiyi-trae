import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

router.post('/setup-first-admin', (req, res) => adminController.setupFirstAdmin(req, res));

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', (req, res) => adminController.getStats(req, res));
router.get('/users', (req, res) => adminController.getUsers(req, res));
router.patch('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));
router.get('/subscriptions', (req, res) => adminController.getSubscriptions(req, res));
router.patch('/subscriptions/:id/status', (req, res) => adminController.updateSubscriptionStatus(req, res));

export default router;
