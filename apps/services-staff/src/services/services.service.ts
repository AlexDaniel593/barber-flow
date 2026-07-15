import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const service = this.serviceRepository.create(createServiceDto);
      return await this.serviceRepository.save(service);
    } catch (error) {
      this.logger.error(`Error creating service: ${error.message}`, error.stack);
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  async findAll(): Promise<Service[]> {
    try {
      return await this.serviceRepository.find({
        where: { isActive: true },
        relations: ['stylists'],
      });
    } catch (error) {
      this.logger.error(`Error finding all services: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve services: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Service> {
    try {
      const service = await this.serviceRepository.findOne({
        where: { id },
        relations: ['stylists'],
      });
      if (!service) {
        throw new Error(`Service with ID ${id} not found`);
      }
      return service;
    } catch (error) {
      this.logger.error(`Error finding service ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      const service = await this.findOne(id);
      Object.assign(service, updateServiceDto);
      return await this.serviceRepository.save(service);
    } catch (error) {
      this.logger.error(`Error updating service ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const service = await this.findOne(id);
      service.isActive = false;
      await this.serviceRepository.save(service);
    } catch (error) {
      this.logger.error(`Error removing service ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to remove service: ${error.message}`);
    }
  }

  async findByStylist(stylistId: string): Promise<Service[]> {
    try {
      return await this.serviceRepository
        .createQueryBuilder('service')
        .innerJoin('service.stylists', 'stylist', 'stylist.id = :stylistId', { stylistId })
        .where('service.isActive = :isActive', { isActive: true })
        .getMany();
    } catch (error) {
      this.logger.error(`Error finding services by stylist ${stylistId}: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve services for stylist: ${error.message}`);
    }
  }
}
