/**
 * 定时群发邮件 Cron 触发端点
 *
 * 在 cron-job.org 中配置：
 *   URL:    https://your-domain.com/api/cron/send-email?templateId=TEMPLATE_UUID
 *   Method: GET
 *   Header: Authorization: Bearer <CRON_SECRET>
 *
 * 环境变量：
 *   CRON_SECRET — 用于验证调用方身份，防止未授权触发
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/config/database';
import { EmailTemplate } from '@/lib/entities/EmailTemplate';
import { sendBulkEmails } from '@/lib/services/bulk-email.service';

export async function GET(request: NextRequest) {
  // 校验 Authorization 头
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET 未配置');
    return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 读取 templateId 参数
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');

  if (!templateId) {
    return NextResponse.json({ error: '缺少 templateId 参数' }, { status: 400 });
  }

  try {
    const dataSource = await getDataSource();
    const template = await dataSource
      .getRepository(EmailTemplate)
      .findOne({ where: { id: templateId } });

    if (!template) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 });
    }

    const result = await sendBulkEmails({
      fromEmail: template.fromEmail,
      fromName: template.fromName,
      subject: template.subject,
      content: template.content,
    });

    console.log(`[Cron] 群发任务已启动，taskId=${result.taskId}，共 ${result.total} 位收件人`);

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      total: result.total,
      startedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] 群发触发失败:', error);
    return NextResponse.json({ error: error.message || '触发失败' }, { status: 500 });
  }
}
