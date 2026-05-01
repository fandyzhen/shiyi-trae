export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/auth';
import { getEmailLogs } from '@/lib/services/bulk-email.service';

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getEmailLogs(taskId, page, limit);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[BulkEmail Logs] Error:', error);
    return NextResponse.json(
      { error: error.message || '获取日志失败' },
      { status: 500 }
    );
  }
}
