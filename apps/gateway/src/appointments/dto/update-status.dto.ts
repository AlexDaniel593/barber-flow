import { IsUUID, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

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
