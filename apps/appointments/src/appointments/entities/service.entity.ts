import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}
