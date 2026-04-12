import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));
router.post('/guest', (req, res) => authController.createGuest(req, res));

export default router;
