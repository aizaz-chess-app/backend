import { IsIn, IsOptional } from 'class-validator';
import { SQUARES, type Square } from 'chess.js';

export class LegalMovesQueryDto {
  @IsOptional()
  @IsIn(SQUARES)
  square?: Square;
}
