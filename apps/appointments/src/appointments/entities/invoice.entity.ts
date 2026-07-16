import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  appointmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @OneToOne(() => Appointment, (appointment) => appointment.invoice)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
