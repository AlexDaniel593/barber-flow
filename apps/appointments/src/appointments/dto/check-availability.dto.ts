import { IsUUID, IsNotEmpty, IsDateString, IsInt, Min } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  @IsNotEmpty()
  stylistId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(1)
  duration: number;
}
