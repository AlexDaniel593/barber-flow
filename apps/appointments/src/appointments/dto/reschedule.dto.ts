import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';

export class RescheduleDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsDateString()
  @IsNotEmpty()
  newStartTime: string;
}
