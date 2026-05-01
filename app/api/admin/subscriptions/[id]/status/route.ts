export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { verifyAdmin } = await import('@/lib/middleware/auth');
    await verifyAdmin(request.headers);

    const { getDataSource } = await import('@/lib/config/database');
    const ds = await getDataSource();

    const { id } = params;
    const { status } = await request.json();

    if (!status || !['active', 'expired', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    await ds.query(`UPDATE subscriptions SET status = $1 WHERE id = $2`, [status, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Subscription Status] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
