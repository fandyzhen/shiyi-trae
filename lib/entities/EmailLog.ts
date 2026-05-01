import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type EmailLogStatus = 'success' | 'failed';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  taskId: string;

  @Column()
  recipientEmail: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column()
  subject: string;

  @Column()
  fromEmail: string;

  @Column()
  fromName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', default: 'failed' })
  status: EmailLogStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  sentAt: Date;
}
