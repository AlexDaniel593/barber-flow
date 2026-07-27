import { IsUUID, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CancelAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;
}
