import { IsString } from 'class-validator';

export class MonthlyReportDto {
  @IsString()
  month: string;

  @IsString()
  year: string;
}
