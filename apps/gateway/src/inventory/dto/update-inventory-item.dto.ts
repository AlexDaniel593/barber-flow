import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;

  @IsUUID()
  @IsOptional()
  serviceId?: string;
}
