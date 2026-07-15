import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  IsDateString,
  IsEmail,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  clientPhone: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsUUID()
  @IsNotEmpty()
  stylistId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  totalPrice?: number;
}
