import { IsIn } from 'class-validator';
import { PlayerColor } from '../game.types.js';

export class ResignDto {
  @IsIn(Object.values(PlayerColor))
  color: PlayerColor;
}
