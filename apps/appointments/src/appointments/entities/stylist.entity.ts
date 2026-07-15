import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('stylists')
export class Stylist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specialties: string[];

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>;

  @OneToMany(() => Appointment, (appointment) => appointment.stylist)
  appointments: Appointment[];
}
