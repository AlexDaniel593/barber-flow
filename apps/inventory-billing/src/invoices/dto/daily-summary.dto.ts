import { IsDateString } from 'class-validator';

export class DailySummaryDto {
  @IsDateString()
  date: string;
}
