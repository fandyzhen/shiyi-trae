import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type UsageType = 'free_trial' | 'registered' | 'subscription';

@Entity('usage_records')
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: UsageType;

  @Column({ nullable: true })
  clothingImageHash: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
