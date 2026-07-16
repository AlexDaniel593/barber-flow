import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
