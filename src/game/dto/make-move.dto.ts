import { IsIn, IsOptional } from 'class-validator';
import { SQUARES, type Square } from 'chess.js';
import { PromotionPiece } from '../game.types.js';

export class MakeMoveDto {
  @IsIn(SQUARES)
  from: Square;

  @IsIn(SQUARES)
  to: Square;

  @IsOptional()
  @IsIn(Object.values(PromotionPiece))
  promotion?: PromotionPiece;
}
