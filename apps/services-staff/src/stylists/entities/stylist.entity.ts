import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

@Entity('stylists')
export class Stylist {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
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

  @ManyToMany(() => Service, (service) => service.stylists)
  services: Service[];
}
