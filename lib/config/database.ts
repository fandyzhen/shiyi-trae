import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { History } from '../entities/History';
import { Subscription } from '../entities/Subscription';
import { UsageRecord } from '../entities/UsageRecord';
import { EmailLog } from '../entities/EmailLog';
import { EmailTemplate } from '../entities/EmailTemplate';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, History, Subscription, UsageRecord, EmailLog, EmailTemplate],
  migrations: [],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
});

let dataSourceInitialized = false;

async function ensureEmailLogsTable(ds: DataSource) {
  try {
    await ds.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "taskId" UUID NOT NULL,
        "recipientEmail" VARCHAR NOT NULL,
        "recipientName" VARCHAR,
        subject VARCHAR NOT NULL,
        "fromEmail" VARCHAR NOT NULL,
        "fromName" VARCHAR NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR DEFAULT 'failed',
        "errorMessage" TEXT,
        "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ds.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_task_id ON email_logs ("taskId")
    `);
    await ds.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        "fromEmail" VARCHAR NOT NULL,
        "fromName" VARCHAR NOT NULL,
        subject VARCHAR NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const columns = await ds.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'email_templates'
    `);
    const existingCols = columns.map((c: any) => c.column_name);
    if (!existingCols.includes('htmlContent')) {
      await ds.query(`ALTER TABLE email_templates ADD COLUMN "htmlContent" TEXT NOT NULL DEFAULT ''`);
    }
    if (!existingCols.includes('fromEmail')) {
      await ds.query(`ALTER TABLE email_templates ADD COLUMN "fromEmail" VARCHAR NOT NULL DEFAULT ''`);
    }
    if (!existingCols.includes('fromName')) {
      await ds.query(`ALTER TABLE email_templates ADD COLUMN "fromName" VARCHAR NOT NULL DEFAULT ''`);
    }
    console.log('[Database] email_logs & email_templates tables ensured');
  } catch (error) {
    console.error('[Database] Failed to ensure tables:', error);
  }
}

export async function getDataSource() {
  if (!dataSourceInitialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    dataSourceInitialized = true;
    ensureEmailLogsTable(AppDataSource).catch(() => {});
  }
  return AppDataSource;
}
