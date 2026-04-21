import { getDataSource } from '../config/database';
import { User } from '../entities/User';
import { UsageRecord } from '../entities/UsageRecord';
import { Subscription } from '../entities/Subscription';

export async function checkCanUse(userId: string, clothingImageHash?: string): Promise<{ canUse: boolean; reason?: string }> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  const usageRecordRepository = dataSource.getRepository(UsageRecord);
  const subscriptionRepository = dataSource.getRepository(Subscription);
  
  console.log('[UsageService] checkCanUse called for userId:', userId);
  
  const user = await userRepository.findOne({ where: { id: userId } });
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

  const hasActiveSubscriptionValue = await checkActiveSubscription(userId, subscriptionRepository);
  if (hasActiveSubscriptionValue) {
    console.log('[UsageService] User has active subscription');
    return { canUse: true };
  }

  if (clothingImageHash) {
    const recentUsage = await usageRecordRepository.findOne({
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

export async function deductUsage(userId: string, clothingImageHash?: string): Promise<void> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  const usageRecordRepository = dataSource.getRepository(UsageRecord);
  const subscriptionRepository = dataSource.getRepository(Subscription);
  
  console.log('[UsageService] deductUsage called for userId:', userId);
  
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  console.log('[UsageService] User before deduction:', {
    role: user.role,
    freeUsesRemaining: user.freeUsesRemaining,
    registeredUsesRemaining: user.registeredUsesRemaining
  });

  const hasActiveSubscriptionValue = await checkActiveSubscription(userId, subscriptionRepository);
  if (hasActiveSubscriptionValue) {
    console.log('[UsageService] User has active subscription, skipping deduction');
    await recordUsageEntry(userId, 'subscription', clothingImageHash, usageRecordRepository);
    return;
  }

  if (clothingImageHash) {
    const recentUsage = await usageRecordRepository.findOne({
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
    await userRepository.save(user);
    await recordUsageEntry(userId, 'free_trial', clothingImageHash, usageRecordRepository);
    console.log('[UsageService] Guest after deduction:', {
      freeUsesRemaining: user.freeUsesRemaining,
      hasUsedFreeTrial: user.hasUsedFreeTrial
    });
    return;
  }

  if (user.role === 'registered') {
    console.log('[UsageService] Deducting registered user use');
    user.registeredUsesRemaining -= 1;
    await userRepository.save(user);
    await recordUsageEntry(userId, 'registered', clothingImageHash, usageRecordRepository);
    console.log('[UsageService] Registered user after deduction:', {
      registeredUsesRemaining: user.registeredUsesRemaining
    });
    return;
  }
}

async function recordUsageEntry(userId: string, type: string, clothingImageHash?: string, usageRecordRepository?: any): Promise<void> {
  const dataSource = await getDataSource();
  const repo = usageRecordRepository || dataSource.getRepository(UsageRecord);
  const record = repo.create({
    userId,
    type: type as any,
    clothingImageHash
  });
  await repo.save(record);
}

async function checkActiveSubscription(userId: string, subscriptionRepository?: any): Promise<boolean> {
  const dataSource = await getDataSource();
  const repo = subscriptionRepository || dataSource.getRepository(Subscription);
  const now = new Date();
  const subscription = await repo.findOne({
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

export async function getUsageInfo(userId: string): Promise<any> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  const subscriptionRepository = dataSource.getRepository(Subscription);
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const hasActiveSubscriptionValue = await checkActiveSubscription(userId, subscriptionRepository);

  return {
    role: user.role,
    hasActiveSubscription: hasActiveSubscriptionValue,
    freeUsesRemaining: user.freeUsesRemaining,
    registeredUsesRemaining: user.registeredUsesRemaining
  };
}
