import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemInput {
  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  appointmentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInput)
  items: InvoiceItemInput[];

  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod: 'cash' | 'card' | 'transfer';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discount?: number;
}
