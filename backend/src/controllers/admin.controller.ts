import { Request, Response } from 'express';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/User';
import { Subscription } from '../entities/Subscription';
import { AppDataSource } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

const userRepository: Repository<User> = AppDataSource.getRepository(User);
const subscriptionRepository: Repository<Subscription> = AppDataSource.getRepository(Subscription);

export class AdminController {
  async setupFirstAdmin(req: Request, res: Response) {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const adminCount = await userRepository.count({ where: { isAdmin: true } });
      
      if (adminCount > 0) {
        return res.status(400).json({ error: 'Admin already exists' });
      }

      const user = await userRepository.findOne({ where: { username } });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.isAdmin = true;
      await userRepository.save(user);

      const { password, ...userWithoutPassword } = user;
      res.json({ message: 'Admin setup successfully', user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const startTime = Date.now();
      console.log('[AdminStats] Starting to fetch stats...');

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      console.log('[AdminStats] Executing queries...');
      const [totalUsers, recentUsers, totalSubscriptions, recentSubscriptions, activeSubscriptions, totalRevenue, recentRevenue] = await Promise.all([
        userRepository.count(),
        userRepository.count({ where: { createdAt: MoreThanOrEqual(sevenDaysAgo) } }),
        subscriptionRepository.count(),
        subscriptionRepository.count({ where: { createdAt: MoreThanOrEqual(sevenDaysAgo) } }),
        subscriptionRepository
          .createQueryBuilder('subscription')
          .where('subscription.startDate <= :now', { now })
          .andWhere('subscription.endDate >= :now', { now })
          .andWhere('subscription.status = :status', { status: 'active' })
          .getCount(),
        subscriptionRepository
          .createQueryBuilder('subscription')
          .select('SUM(subscription.amount)', 'total')
          .getRawOne(),
        subscriptionRepository
          .createQueryBuilder('subscription')
          .select('SUM(subscription.amount)', 'total')
          .where('subscription.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
          .getRawOne(),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[AdminStats] Done in ${duration}ms`);

      res.json({
        totalUsers,
        recentUsers,
        totalSubscriptions,
        recentSubscriptions,
        activeSubscriptions,
        totalRevenue: totalRevenue?.total || 0,
        recentRevenue: recentRevenue?.total || 0,
      });
    } catch (error: any) {
      console.error('[AdminStats] Error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const roleFilter = req.query.role as string || '';

      const queryBuilder = userRepository.createQueryBuilder('user');

      if (search) {
        queryBuilder.andWhere(
          '(user.nickname ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (roleFilter) {
        queryBuilder.andWhere('user.role = :role', { role: roleFilter });
      }

      const [users, total] = await queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      res.json({
        users: usersWithoutPassword,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.role = role;
      await userRepository.save(user);

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSubscriptions(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const statusFilter = req.query.status as string || '';

      const queryBuilder = subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user');

      if (search) {
        queryBuilder.andWhere(
          '(user.nickname ILIKE :search OR user.email ILIKE :search OR subscription.id::text ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (statusFilter) {
        queryBuilder.andWhere('subscription.status = :status', { status: statusFilter });
      }

      const [subscriptions, total] = await queryBuilder
        .orderBy('subscription.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const subscriptionsWithUser = subscriptions.map((sub) => ({
        ...sub,
        user: sub.user ? {
          id: sub.user.id,
          nickname: sub.user.nickname,
          email: sub.user.email,
        } : null,
      }));

      res.json({
        subscriptions: subscriptionsWithUser,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateSubscriptionStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const subscription = await subscriptionRepository.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      subscription.status = status;
      await subscriptionRepository.save(subscription);

      res.json({ subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
