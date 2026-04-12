import { Response } from 'express';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/Subscription';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

const subscriptionRepository: Repository<Subscription> = AppDataSource.getRepository(Subscription);
const userRepository: Repository<User> = AppDataSource.getRepository(User);

export class SubscriptionController {
  async createSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { plan, wechatPaymentId } = req.body;
      const user = await userRepository.findOne({ where: { id: req.user.userId } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const startDate = new Date();
      let endDate = new Date();
      let amount = 9.9;

      if (plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        amount = 99;
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscription = subscriptionRepository.create({
        userId: req.user.userId,
        plan: plan || 'monthly',
        status: 'active',
        amount,
        wechatPaymentId,
        startDate,
        endDate
      });

      await subscriptionRepository.save(subscription);

      user.role = 'subscriber';
      await userRepository.save(user);

      res.json({
        message: 'Subscription created successfully',
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscription = await subscriptionRepository.findOne({
        where: { userId: req.user.userId },
        order: { createdAt: 'DESC' }
      });

      if (!subscription) {
        return res.json({ subscription: null });
      }

      const now = new Date();
      const isActive = now >= subscription.startDate && now <= subscription.endDate;

      res.json({
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: isActive ? subscription.status : 'expired',
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
