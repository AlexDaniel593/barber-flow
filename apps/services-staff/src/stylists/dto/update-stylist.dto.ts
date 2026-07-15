import { IsString, IsOptional, IsEmail, IsArray, IsObject, MaxLength } from 'class-validator';

export class UpdateStylistDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsObject()
  @IsOptional()
  workingHours?: Record<string, any>;
}
