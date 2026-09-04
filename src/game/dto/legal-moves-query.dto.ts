import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SQUARES, type Square } from 'chess.js';

export class LegalMovesQueryDto {
  @ApiPropertyOptional({
    enum: SQUARES,
    enumName: 'Square',
    description: 'Return only the moves available to the piece on this square. Omit for every legal move.'
  })
  @IsOptional()
  @IsIn(SQUARES)
  square?: Square;
}
