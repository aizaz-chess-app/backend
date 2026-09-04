import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PlayerColor } from '../game.types.js';

export class ResignDto {
  @ApiProperty({
    enum: Object.values(PlayerColor),
    enumName: 'PlayerColor',
    description: 'The side resigning. The other side wins.'
  })
  @IsIn(Object.values(PlayerColor))
  color: PlayerColor;
}
