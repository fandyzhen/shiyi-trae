import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getUsageInfo } = await import('@/lib/services/usage.service');
    const { userId } = await requireAuth(request.headers);
    const usageInfo = await getUsageInfo(userId);
    return NextResponse.json(usageInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
