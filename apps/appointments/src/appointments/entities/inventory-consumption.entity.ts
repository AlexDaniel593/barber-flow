import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('inventory_consumptions')
export class InventoryConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'uuid', nullable: true })
  appointmentId?: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.inventoryConsumption)
  @JoinColumn({ name: 'appointmentId' })
  appointment?: Appointment;
}
