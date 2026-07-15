import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;

  @IsUUID()
  @IsOptional()
  serviceId?: string;
}
