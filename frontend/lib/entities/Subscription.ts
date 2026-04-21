import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type SubscriptionPlan = 'monthly' | 'yearly';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'monthly' })
  plan: SubscriptionPlan;

  @Column({ type: 'varchar', default: 'active' })
  status: SubscriptionStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  wechatPaymentId: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
