export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { verifyAdmin } = await import('@/lib/middleware/auth');
    await verifyAdmin(request.headers);

    const { getDataSource } = await import('@/lib/config/database');
    const ds = await getDataSource();

    const totalUsers = await ds.query(`SELECT COUNT(*)::int as count FROM users`);
    const recentUsers = await ds.query(
      `SELECT COUNT(*)::int as count FROM users WHERE "createdAt" >= NOW() - INTERVAL '7 days'`
    );

    const totalSubscriptions = await ds.query(`SELECT COUNT(*)::int as count FROM subscriptions`);
    const recentSubscriptions = await ds.query(
      `SELECT COUNT(*)::int as count FROM subscriptions WHERE "createdAt" >= NOW() - INTERVAL '7 days'`
    );
    const activeSubscriptions = await ds.query(
      `SELECT COUNT(*)::int as count FROM subscriptions WHERE status = 'active'`
    );
    const totalRevenue = await ds.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric as sum FROM subscriptions`
    );
    const recentRevenue = await ds.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric as sum FROM subscriptions WHERE "createdAt" >= NOW() - INTERVAL '7 days'`
    );

    return NextResponse.json({
      totalUsers: parseInt(totalUsers[0]?.count || '0', 10),
      recentUsers: parseInt(recentUsers[0]?.count || '0', 10),
      totalSubscriptions: parseInt(totalSubscriptions[0]?.count || '0', 10),
      recentSubscriptions: parseInt(recentSubscriptions[0]?.count || '0', 10),
      activeSubscriptions: parseInt(activeSubscriptions[0]?.count || '0', 10),
      totalRevenue: parseFloat(totalRevenue[0]?.sum || '0'),
      recentRevenue: parseFloat(recentRevenue[0]?.sum || '0'),
    });
  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
