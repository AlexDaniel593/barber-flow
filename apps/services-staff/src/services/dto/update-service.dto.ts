import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
