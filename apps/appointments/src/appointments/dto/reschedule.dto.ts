import { IsUUID, IsNotEmpty, IsDateString, IsEmail, IsOptional } from 'class-validator';

export class RescheduleDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsDateString()
  @IsNotEmpty()
  newStartTime: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;
}
