import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

// Shared by the create request and the game state response, so the spec carries one TimeControlDto component.
export class TimeControlDto {
  @ApiProperty({ minimum: 1, maximum: 10800, example: 300, description: 'Starting time per side, in seconds.' })
  @IsInt()
  @Min(1)
  @Max(10800)
  initialSeconds: number;

  @ApiProperty({ minimum: 0, maximum: 180, example: 3, description: 'Seconds added to the mover clock after each move.' })
  @IsInt()
  @Min(0)
  @Max(180)
  incrementSeconds: number;
}
