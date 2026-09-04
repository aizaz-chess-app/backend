import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SQUARES, type Square } from 'chess.js';
import { PromotionPiece } from '../game.types.js';

export class MakeMoveDto {
  @ApiProperty({ enum: SQUARES, enumName: 'Square', example: 'e2' })
  @IsIn(SQUARES)
  from: Square;

  @ApiProperty({ enum: SQUARES, enumName: 'Square', example: 'e4' })
  @IsIn(SQUARES)
  to: Square;

  @ApiPropertyOptional({
    enum: Object.values(PromotionPiece),
    enumName: 'PromotionPiece',
    description: 'Required when the move promotes a pawn; without it the move is rejected as illegal.'
  })
  @IsOptional()
  @IsIn(Object.values(PromotionPiece))
  promotion?: PromotionPiece;
}
