import { Router } from 'express';
import { TryOnController, upload } from '../controllers/tryon.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const tryOnController = new TryOnController();

router.post(
  '/generate',
  authMiddleware,
  upload.fields([
    { name: 'personImage', maxCount: 1 },
    { name: 'clothingImage', maxCount: 1 }
  ]),
  (req, res) => tryOnController.generateTryOn(req, res)
);

router.get('/history', authMiddleware, (req, res) => tryOnController.getHistory(req, res));
router.delete('/history/:id', authMiddleware, (req, res) => tryOnController.deleteHistory(req, res));
router.get('/usage', authMiddleware, (req, res) => tryOnController.getUsageInfo(req, res));

export default router;
