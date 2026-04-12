import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TryOnService } from '../services/tryon.service';
import { UsageService } from '../services/usage.service';
import { History } from '../entities/History';
import { AppDataSource } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

const tryOnService = new TryOnService();
const usageService = new UsageService();
const historyRepository = AppDataSource.getRepository(History);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const subDir = file.fieldname === 'personImage' ? 'persons' : 'clothings';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const upload = multer({ storage });

export class TryOnController {
  async generateTryOn(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { keepOriginalClothing, stylePreference } = req.body;
      const personImagePath = (req.files as any)?.personImage?.[0]?.path;
      const clothingImagePath = (req.files as any)?.clothingImage?.[0]?.path;

      if (!personImagePath || !clothingImagePath) {
        return res.status(400).json({ error: 'Both person image and clothing image are required' });
      }

      const clothingImageHash = tryOnService.getClothingImageHash(clothingImagePath);

      const { canUse, reason } = await usageService.checkCanUse(req.user.userId, clothingImageHash);
      if (!canUse) {
        return res.status(403).json({ error: reason });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const sendProgress = (progress: number, message: string) => {
        res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
      };

      sendProgress(10, '正在分析图片...');
      const clothingType = await tryOnService.detectClothingType(clothingImagePath);

      sendProgress(30, '正在生成试衣效果...');
      const resultImagePath = await tryOnService.generateTryOn(
        personImagePath,
        clothingImagePath,
        keepOriginalClothing === 'true',
        stylePreference
      );

      sendProgress(70, '正在保存结果...');
      await usageService.deductUsage(req.user.userId, clothingImageHash);

      const history = historyRepository.create({
        userId: req.user.userId,
        personImagePath,
        clothingImagePath,
        resultImagePath,
        clothingType,
        keepOriginalClothing: keepOriginalClothing === 'true',
        stylePreference
      });
      await historyRepository.save(history);

      sendProgress(100, '完成！');
      res.write(`data: ${JSON.stringify({ 
        progress: 100, 
        message: '完成！',
        result: {
          historyId: history.id,
          resultImageUrl: `/uploads/results/${path.basename(resultImagePath)}`
        }
      })}\n\n`);
      res.end();

    } catch (error: any) {
      console.error('TryOn error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const histories = await historyRepository.find({
        where: { userId: req.user.userId },
        order: { createdAt: 'DESC' }
      });

      const historiesWithUrls = histories.map(h => ({
        id: h.id,
        personImageUrl: `/uploads/persons/${path.basename(h.personImagePath)}`,
        clothingImageUrl: `/uploads/clothings/${path.basename(h.clothingImagePath)}`,
        resultImageUrl: `/uploads/results/${path.basename(h.resultImagePath)}`,
        clothingType: h.clothingType,
        keepOriginalClothing: h.keepOriginalClothing,
        stylePreference: h.stylePreference,
        createdAt: h.createdAt
      }));

      res.json(historiesWithUrls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const history = await historyRepository.findOne({ where: { id, userId: req.user.userId } });

      if (!history) {
        return res.status(404).json({ error: 'History not found' });
      }

      await historyRepository.remove(history);
      res.json({ message: 'History deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUsageInfo(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const usageInfo = await usageService.getUsageInfo(req.user.userId);
      res.json(usageInfo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
