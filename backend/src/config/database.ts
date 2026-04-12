import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { History } from '../entities/History';
import { Subscription } from '../entities/Subscription';
import { UsageRecord } from '../entities/UsageRecord';
import path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../../data/virtual_try_on.sqlite'),
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, History, Subscription, UsageRecord],
  migrations: [],
  subscribers: [],
});
