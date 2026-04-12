import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

router.post('/', authMiddleware, (req, res) => subscriptionController.createSubscription(req, res));
router.get('/', authMiddleware, (req, res) => subscriptionController.getSubscription(req, res));

export default router;
