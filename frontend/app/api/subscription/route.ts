import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getDataSource } = await import('@/lib/config/database');
    const { Subscription } = await import('@/lib/entities/Subscription');
    
    const { userId } = await requireAuth(request.headers);
    const dataSource = await getDataSource();
    const subscriptionRepository = dataSource.getRepository(Subscription);
    
    const subscription = await subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const now = new Date();
    const isActive = now >= subscription.startDate && now <= subscription.endDate;

    return NextResponse.json({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getDataSource } = await import('@/lib/config/database');
    const { Subscription } = await import('@/lib/entities/Subscription');
    const { User } = await import('@/lib/entities/User');
    
    const { userId } = await requireAuth(request.headers);
    const { plan, wechatPaymentId } = await request.json();
    
    const dataSource = await getDataSource();
    const subscriptionRepository = dataSource.getRepository(Subscription);
    const userRepository = dataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      userId,
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

    return NextResponse.json({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
