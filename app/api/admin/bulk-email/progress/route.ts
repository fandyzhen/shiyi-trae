export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/auth';
import { getProgress } from '@/lib/services/bulk-email.service';

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少 taskId 参数' },
        { status: 400 }
      );
    }

    const progress = getProgress(taskId);
    if (!progress) {
      return NextResponse.json(
        { error: '任务不存在或已过期' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('[BulkEmail Progress] Error:', error);
    return NextResponse.json(
      { error: error.message || '查询进度失败' },
      { status: 500 }
    );
  }
}
