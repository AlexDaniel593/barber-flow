import { IsOptional, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class FindAppointmentsDto {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsUUID()
  @IsOptional()
  stylistId?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
