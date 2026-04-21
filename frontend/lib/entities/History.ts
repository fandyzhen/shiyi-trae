import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column()
  userId: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;
}
