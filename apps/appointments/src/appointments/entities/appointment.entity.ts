import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany, 
  OneToOne, 
  JoinColumn 
} from 'typeorm';
import { Stylist } from './stylist.entity';
import { Service } from './service.entity';
import { InventoryConsumption } from './inventory-consumption.entity';
import { Invoice } from './invoice.entity';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  clientName: string;

  @Column({ type: 'varchar', length: 20 })
  clientPhone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  clientEmail?: string;

  @Column({ type: 'uuid' })
  stylistId: string;

  @ManyToOne(() => Stylist, (stylist) => stylist.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stylistId' })
  stylist: Stylist;

  @Column({ type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column('int')
  duration: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice?: number;

  @Column({ default: false })
  paid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => InventoryConsumption, (ic) => ic.appointment)
  inventoryConsumption: InventoryConsumption[];

  @OneToOne(() => Invoice, (invoice) => invoice.appointment, { nullable: true })
  invoice?: Invoice;
}
