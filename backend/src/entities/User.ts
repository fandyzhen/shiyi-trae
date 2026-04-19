import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { History } from './History';
import { Subscription } from './Subscription';

export type UserRole = 'guest' | 'registered' | 'subscriber';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'guest' })
  role: UserRole;

  @Column({ default: 0 })
  freeUsesRemaining: number;

  @Column({ default: 10 })
  registeredUsesRemaining: number;

  @Column({ default: false })
  hasUsedFreeTrial: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => History, history => history.user)
  histories: History[];

  @OneToMany(() => Subscription, subscription => subscription.user)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
