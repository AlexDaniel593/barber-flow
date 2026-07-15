import { IsUUID, IsInt, IsIn, IsString, IsNotEmpty, Min, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsIn(['add', 'subtract'])
  operation: 'add' | 'subtract';

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;
}
