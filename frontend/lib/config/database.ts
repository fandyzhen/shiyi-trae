import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { History } from '../entities/History';
import { Subscription } from '../entities/Subscription';
import { UsageRecord } from '../entities/UsageRecord';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, History, Subscription, UsageRecord],
  migrations: [],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
});

let dataSourceInitialized = false;

export async function getDataSource() {
  if (!dataSourceInitialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    dataSourceInitialized = true;
  }
  return AppDataSource;
}
