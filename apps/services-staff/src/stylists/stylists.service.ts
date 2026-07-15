import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stylist } from './entities/stylist.entity';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';

@Injectable()
export class StylistsService {
  private readonly logger = new Logger(StylistsService.name);

  constructor(
    @InjectRepository(Stylist)
    private readonly stylistRepository: Repository<Stylist>,
  ) {}

  async create(createStylistDto: CreateStylistDto): Promise<Stylist> {
    try {
      const stylist = this.stylistRepository.create(createStylistDto);
      return await this.stylistRepository.save(stylist);
    } catch (error) {
      this.logger.error(`Error creating stylist: ${error.message}`, error.stack);
      throw new Error(`Failed to create stylist: ${error.message}`);
    }
  }

  async findAll(): Promise<Stylist[]> {
    try {
      return await this.stylistRepository.find({
        relations: ['services'],
      });
    } catch (error) {
      this.logger.error(`Error finding all stylists: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve stylists: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Stylist> {
    try {
      const stylist = await this.stylistRepository.findOne({
        where: { id },
        relations: ['services'],
      });
      if (!stylist) {
        throw new Error(`Stylist with ID ${id} not found`);
      }
      return stylist;
    } catch (error) {
      this.logger.error(`Error finding stylist ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateStylistDto: UpdateStylistDto): Promise<Stylist> {
    try {
      const stylist = await this.findOne(id);
      Object.assign(stylist, updateStylistDto);
      return await this.stylistRepository.save(stylist);
    } catch (error) {
      this.logger.error(`Error updating stylist ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to update stylist: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const stylist = await this.findOne(id);
      await this.stylistRepository.remove(stylist);
    } catch (error) {
      this.logger.error(`Error removing stylist ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to remove stylist: ${error.message}`);
    }
  }
}
