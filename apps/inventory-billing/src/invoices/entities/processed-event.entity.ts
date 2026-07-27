import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('processed_events')
@Index(['eventKey'], { unique: true })
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  eventKey: string;

  @Column({ type: 'varchar', length: 80 })
  eventType: string;

  @Column({ type: 'uuid', nullable: true })
  appointmentId?: string;

  @CreateDateColumn()
  processedAt: Date;
}