import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLowStockDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  threshold?: number;
}
