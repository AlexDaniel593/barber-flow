import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StylistsService } from './stylists.service';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';

@Controller()
export class StylistsController {
  constructor(private readonly stylistsService: StylistsService) {}

  @GrpcMethod('StylistService', 'FindOneStylist')
  async findOneStylist(data: { id: string }) {
    try {
      const stylist = await this.stylistsService.findOne(data.id);
      return {
        id: stylist.id,
        name: stylist.name,
        email: stylist.email,
        isActive: stylist.isActive,
        workingHours: JSON.stringify(stylist.workingHours ?? {}),
      };
    } catch (error) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Stylist with ID ${data.id} not found`,
      });
    }
  }

  /**
   * Nuevo salto síncrono — Actividad B (examen)
   * Consulta que hoy NO existía: obtener horario de trabajo + especialidades
   * de un estilista directamente desde el propietario del dato (services-staff),
   * sin que appointments duplique la lógica de parsing de workingHours.
   *
   * Anclaje: extiende el contrato en apps/proto/barber.proto (StylistService)
   * siguiendo el mismo patrón de FindOneStylist (líneas 13-30 de este archivo).
   */
  @GrpcMethod('StylistService', 'GetStylistWorkingHours')
  async getStylistWorkingHours(data: { id: string }) {
    // Validación de entrada: id vacío o ausente → INVALID_ARGUMENT → 400 en Gateway
    if (!data.id || data.id.trim() === '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'El campo id es requerido y no puede estar vacío',
      });
    }
    try {
      const stylist = await this.stylistsService.findOne(data.id);
      return {
        id: stylist.id,
        name: stylist.name,
        isActive: stylist.isActive,
        workingHours: JSON.stringify(stylist.workingHours ?? {}),
        specialties: stylist.specialties ?? [],
      };
    } catch (error) {
      // Re-lanzar RpcException sin envolver (ej: INVALID_ARGUMENT ya lanzado)
      if (error instanceof RpcException) throw error;
      // Recurso no encontrado → NOT_FOUND → 404 en Gateway
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Estilista con ID ${data.id} no encontrado`,
      });
    }
  }

  @MessagePattern({ cmd: 'stylists.create' })
  async create(@Payload() createStylistDto: CreateStylistDto) {
    return await this.stylistsService.create(createStylistDto);
  }

  @MessagePattern({ cmd: 'stylists.findAll' })
  async findAll() {
    return await this.stylistsService.findAll();
  }

  @MessagePattern({ cmd: 'stylists.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.stylistsService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'stylists.update' })
  async update(@Payload() data: { id: string; updateStylistDto: UpdateStylistDto }) {
    return await this.stylistsService.update(data.id, data.updateStylistDto);
  }

  @MessagePattern({ cmd: 'stylists.remove' })
  async remove(@Payload() data: { id: string }) {
    await this.stylistsService.remove(data.id);
    return { success: true };
  }

  /**
   * Actividad B — handler TCP para que el Gateway acceda directamente
   * a GetStylistWorkingHours sin pasar por appointments.
   * Reutiliza el método gRPC getStylistWorkingHours y devuelve la misma
   * estructura para que el Gateway no duplique la lógica de mapeo.
   */
  @MessagePattern({ cmd: 'stylists.getStylistWorkingHours' })
  async getStylistWorkingHoursMsg(@Payload() data: { id: string }) {
    return this.getStylistWorkingHours(data);
  }
}

