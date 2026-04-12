import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  personImagePath: string;

  @Column()
  clothingImagePath: string;

  @Column()
  resultImagePath: string;

  @Column({ nullable: true })
  clothingType: string;

  @Column({ default: false })
  keepOriginalClothing: boolean;

  @Column({ nullable: true })
  stylePreference: string;

  @ManyToOne(() => User, user => user.histories, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
