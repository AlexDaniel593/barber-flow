import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Entity('inventory_consumptions')
export class InventoryConsumption {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @ManyToOne(() => InventoryItem, (item) => item.consumptions)
  @JoinColumn({ name: 'inventoryId' })
  inventory: InventoryItem;

  @Column('int')
  quantity: number;

  @Column({ type: 'uuid', nullable: true })
  appointmentId?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;
}
