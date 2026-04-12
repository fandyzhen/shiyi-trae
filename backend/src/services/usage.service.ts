import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { UsageRecord } from '../entities/UsageRecord';
import { Subscription } from '../entities/Subscription';
import { AppDataSource } from '../config/database';

export class UsageService {
  private userRepository: Repository<User>;
  private usageRecordRepository: Repository<UsageRecord>;
  private subscriptionRepository: Repository<Subscription>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.usageRecordRepository = AppDataSource.getRepository(UsageRecord);
    this.subscriptionRepository = AppDataSource.getRepository(Subscription);
  }

  async checkCanUse(userId: string, clothingImageHash?: string): Promise<{ canUse: boolean; reason?: string }> {
    console.log('[UsageService] checkCanUse called for userId:', userId);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      console.log('[UsageService] User not found');
      return { canUse: false, reason: 'User not found' };
    }

    console.log('[UsageService] User info:', {
      role: user.role,
      freeUsesRemaining: user.freeUsesRemaining,
      registeredUsesRemaining: user.registeredUsesRemaining,
      hasUsedFreeTrial: user.hasUsedFreeTrial
    });

    const hasActiveSubscription = await this.hasActiveSubscription(userId);
    if (hasActiveSubscription) {
      console.log('[UsageService] User has active subscription');
      return { canUse: true };
    }

    if (clothingImageHash) {
      const recentUsage = await this.usageRecordRepository.findOne({
        where: { userId, clothingImageHash },
        order: { createdAt: 'DESC' }
      });
      if (recentUsage) {
        console.log('[UsageService] User has recent usage for same clothing');
        return { canUse: true };
      }
    }

    if (user.role === 'guest') {
      if (user.freeUsesRemaining > 0) {
        console.log('[UsageService] Guest has free uses remaining:', user.freeUsesRemaining);
        return { canUse: true };
      }
      console.log('[UsageService] Guest free trial used up');
      return { canUse: false, reason: '免费试用已使用完，请注册账号' };
    }

    if (user.role === 'registered') {
      if (user.registeredUsesRemaining > 0) {
        console.log('[UsageService] Registered user has uses remaining:', user.registeredUsesRemaining);
        return { canUse: true };
      }
      console.log('[UsageService] Registered user uses remaining');
      return { canUse: false, reason: '试用次数已用完，请订阅会员' };
    }

    console.log('[UsageService] Unknown error');
    return { canUse: false, reason: 'Unknown error' };
  }

  async deductUsage(userId: string, clothingImageHash?: string): Promise<void> {
    console.log('[UsageService] deductUsage called for userId:', userId);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    console.log('[UsageService] User before deduction:', {
      role: user.role,
      freeUsesRemaining: user.freeUsesRemaining,
      registeredUsesRemaining: user.registeredUsesRemaining
    });

    const hasActiveSubscription = await this.hasActiveSubscription(userId);
    if (hasActiveSubscription) {
      console.log('[UsageService] User has active subscription, skipping deduction');
      await this.recordUsage(userId, 'subscription', clothingImageHash);
      return;
    }

    if (clothingImageHash) {
      const recentUsage = await this.usageRecordRepository.findOne({
        where: { userId, clothingImageHash },
        order: { createdAt: 'DESC' }
      });
      if (recentUsage) {
        console.log('[UsageService] User has recent usage for same clothing, skipping deduction');
        return;
      }
    }

    if (user.role === 'guest') {
      console.log('[UsageService] Deducting guest free use');
      user.freeUsesRemaining -= 1;
      user.hasUsedFreeTrial = true;
      await this.userRepository.save(user);
      await this.recordUsage(userId, 'free_trial', clothingImageHash);
      console.log('[UsageService] Guest after deduction:', {
        freeUsesRemaining: user.freeUsesRemaining,
        hasUsedFreeTrial: user.hasUsedFreeTrial
      });
      return;
    }

    if (user.role === 'registered') {
      console.log('[UsageService] Deducting registered user use');
      user.registeredUsesRemaining -= 1;
      await this.userRepository.save(user);
      await this.recordUsage(userId, 'registered', clothingImageHash);
      console.log('[UsageService] Registered user after deduction:', {
        registeredUsesRemaining: user.registeredUsesRemaining
      });
      return;
    }
  }

  private async recordUsage(userId: string, type: string, clothingImageHash?: string): Promise<void> {
    const record = this.usageRecordRepository.create({
      userId,
      type: type as any,
      clothingImageHash
    });
    await this.usageRecordRepository.save(record);
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const now = new Date();
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: { createdAt: 'DESC' }
    });

    if (!subscription) {
      return false;
    }

    return now >= subscription.startDate && now <= subscription.endDate;
  }

  async getUsageInfo(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const hasActiveSubscription = await this.hasActiveSubscription(userId);

    return {
      role: user.role,
      hasActiveSubscription,
      freeUsesRemaining: user.freeUsesRemaining,
      registeredUsesRemaining: user.registeredUsesRemaining
    };
  }
}
