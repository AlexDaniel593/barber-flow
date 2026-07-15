import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateStylistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsObject()
  @IsOptional()
  workingHours?: Record<string, any>;
}
