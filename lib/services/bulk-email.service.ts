import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { getDataSource } from '../config/database';
import { EmailLog } from '../entities/EmailLog';
import { User } from '../entities/User';

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 1000;

interface BulkEmailParams {
  fromEmail: string;
  fromName: string;
  subject: string;
  content: string;
  excludeUserIds?: string[];
}

interface BulkEmailProgress {
  taskId: string;
  total: number;
  sent: number;
  success: number;
  failed: number;
  isCompleted: boolean;
}

const progressStore = new Map<string, BulkEmailProgress>();

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getRecipients(excludeUserIds?: string[]): Promise<{ id: string; email: string; nickname: string }[]> {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);

  const qb = userRepo
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.nickname'])
    .where('user.email IS NOT NULL')
    .andWhere('user.email != :empty', { empty: '' })
    .andWhere('user.role != :guestRole', { guestRole: 'guest' });

  if (excludeUserIds && excludeUserIds.length > 0) {
    qb.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds: excludeUserIds });
  }

  return qb.getMany();
}

export async function sendBulkEmails(params: BulkEmailParams): Promise<{ taskId: string; total: number }> {
  const { fromEmail, fromName, subject, content, excludeUserIds } = params;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY 未配置');
  }

  const recipients = await getRecipients(excludeUserIds);

  if (recipients.length === 0) {
    throw new Error('没有可发送的收件人');
  }

  const taskId = uuidv4();

  const progress: BulkEmailProgress = {
    taskId,
    total: recipients.length,
    sent: 0,
    success: 0,
    failed: 0,
    isCompleted: false,
  };
  progressStore.set(taskId, progress);

  const ds = await getDataSource();
  const logRepo = ds.getRepository(EmailLog);
  const resend = new Resend(resendApiKey);

  setImmediate(async () => {
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const sendPromises = batch.map(async (recipient) => {
        const logEntry = logRepo.create({
          taskId,
          recipientEmail: recipient.email,
          recipientName: recipient.nickname,
          subject,
          fromEmail,
          fromName,
          content,
          status: 'failed' as const,
        });

        try {
          const { error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient.email],
            subject,
            html: content,
          });

          if (error) {
            logEntry.errorMessage = error.message || 'Unknown error';
          } else {
            logEntry.status = 'success' as const;
          }
        } catch (err: any) {
          logEntry.errorMessage = err.message || 'Send exception';
        }

        try {
          await logRepo.save(logEntry);
        } catch (saveErr) {
          console.error('[BulkEmail] Failed to save log:', saveErr);
        }

        progress.sent++;
        if (logEntry.status === 'success') {
          progress.success++;
        } else {
          progress.failed++;
        }
      });

      await Promise.all(sendPromises);

      if (i + BATCH_SIZE < recipients.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    progress.isCompleted = true;
    console.log(`[BulkEmail] Task ${taskId} completed. Total: ${progress.total}, Success: ${progress.success}, Failed: ${progress.failed}`);
  });

  return { taskId, total: recipients.length };
}

export function getProgress(taskId: string): BulkEmailProgress | null {
  return progressStore.get(taskId) || null;
}

export async function getEmailLogs(taskId?: string, page: number = 1, limit: number = 20) {
  const ds = await getDataSource();
  const logRepo = ds.getRepository(EmailLog);

  if (taskId) {
    const [logs, total] = await logRepo.findAndCount({
      where: { taskId },
      order: { sentAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total, page, limit };
  }

  const result = await ds.query(`
    SELECT 
      "taskId",
      MAX("subject") as subject,
      MAX("fromName") as "fromName",
      MAX("fromEmail") as "fromEmail",
      MAX("sentAt") as "sentAt",
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'success')::int as success,
      COUNT(*) FILTER (WHERE status = 'failed')::int as failed
    FROM email_logs
    GROUP BY "taskId"
    ORDER BY MAX("sentAt") DESC
    OFFSET $1 LIMIT $2
  `, [(page - 1) * limit, limit]);

  const countResult = await ds.query(`
    SELECT COUNT(DISTINCT "taskId")::int as count FROM email_logs
  `);
  const total = parseInt(countResult[0]?.count || '0', 10);

  return { tasks: result, total, page, limit };
}

export async function getTodaySentCount(): Promise<number> {
  const ds = await getDataSource();
  const result = await ds.query(`
    SELECT COUNT(*)::int as count FROM email_logs 
    WHERE "sentAt" >= CURRENT_DATE
  `);
  return parseInt(result[0]?.count || '0', 10);
}
