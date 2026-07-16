import { IsUUID, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateStatusDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
