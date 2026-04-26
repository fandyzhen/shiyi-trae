import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/auth';
import { sendBulkEmails, getRecipients, getTodaySentCount } from '@/lib/services/bulk-email.service';

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);

    const body = await request.json();
    const { fromEmail, fromName, subject, content, excludeUserIds } = body;

    if (!fromEmail || !fromName || !subject || !content) {
      return NextResponse.json(
        { error: '请填写完整的发件人信息、标题和内容' },
        { status: 400 }
      );
    }

    const todaySent = await getTodaySentCount();
    if (todaySent >= 100) {
      return NextResponse.json(
        { error: '今日发送量已达上限（100封），请明天再试' },
        { status: 400 }
      );
    }

    const result = await sendBulkEmails({
      fromEmail,
      fromName,
      subject,
      content,
      excludeUserIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[BulkEmail Send] Error:', error);
    return NextResponse.json(
      { error: error.message || '发送失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);

    const { searchParams } = new URL(request.url);
    const excludeIds = searchParams.get('excludeIds');
    const excludeUserIds = excludeIds ? excludeIds.split(',') : undefined;

    const recipients = await getRecipients(excludeUserIds);
    const todaySent = await getTodaySentCount();

    return NextResponse.json({
      recipients: recipients.map(r => ({ id: r.id, email: r.email, nickname: r.nickname })),
      total: recipients.length,
      todaySent,
      todayLimit: 100,
      todayRemaining: Math.max(0, 100 - todaySent),
    });
  } catch (error: any) {
    console.error('[BulkEmail Recipients] Error:', error);
    return NextResponse.json(
      { error: error.message || '获取收件人失败' },
      { status: 500 }
    );
  }
}
