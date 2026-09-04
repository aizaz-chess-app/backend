import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_POSITION, SQUARES, type Square } from 'chess.js';
import { DrawReason, GameResult, GameStatus, PieceType, PlayerColor, PromotionPiece } from '../game.types.js';

export class MoveDto {
  @ApiProperty({ description: 'Standard algebraic notation.', example: 'e4' })
  san!: string;

  @ApiProperty({ description: 'Long algebraic notation.', example: 'e2e4' })
  lan!: string;

  @ApiProperty({ enum: SQUARES, enumName: 'Square', example: 'e2' })
  from!: Square;

  @ApiProperty({ enum: SQUARES, enumName: 'Square', example: 'e4' })
  to!: Square;

  @ApiProperty({ enum: Object.values(PieceType), enumName: 'PieceType', description: 'The piece that moved.' })
  piece!: PieceType;

  @ApiProperty({ enum: Object.values(PlayerColor), enumName: 'PlayerColor', description: 'The side that moved.' })
  color!: PlayerColor;

  @ApiPropertyOptional({
    enum: Object.values(PieceType),
    enumName: 'PieceType',
    description: 'The captured piece. Absent when the move captured nothing.'
  })
  captured?: PieceType;

  @ApiPropertyOptional({
    enum: Object.values(PromotionPiece),
    enumName: 'PromotionPiece',
    description: 'The piece a pawn promoted to. Absent when the move was not a promotion.'
  })
  promotion?: PromotionPiece;
}

export class GameStateDto {
  @ApiProperty({ format: 'uuid', description: 'Anyone holding this id can move for either side.' })
  id!: string;

  @ApiProperty({ description: 'Forsyth-Edwards Notation for the current position.', example: DEFAULT_POSITION })
  fen!: string;

  @ApiProperty({ description: 'Portable Game Notation for the moves played so far.', example: '1. e4 e5' })
  pgn!: string;

  @ApiProperty({ enum: Object.values(PlayerColor), enumName: 'PlayerColor', description: 'The side to move.' })
  turn!: PlayerColor;

  @ApiProperty({ description: 'Full move number, incremented after black moves.', example: 1 })
  moveNumber!: number;

  @ApiProperty({ description: 'Whether the side to move is in check.' })
  inCheck!: boolean;

  @ApiProperty({ enum: Object.values(GameStatus), enumName: 'GameStatus' })
  status!: GameStatus;

  @ApiProperty({
    enum: Object.values(GameResult),
    enumName: 'GameResult',
    nullable: true,
    description: 'Null while the game is in progress.'
  })
  result!: GameResult | null;

  @ApiProperty({
    enum: Object.values(DrawReason),
    enumName: 'DrawReason',
    nullable: true,
    description: 'Null unless the game ended in a draw.'
  })
  drawReason!: DrawReason | null;

  @ApiProperty({ type: [MoveDto], description: 'Every move played, oldest first.' })
  history!: MoveDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class LegalMovesDto {
  @ApiProperty({
    enum: SQUARES,
    enumName: 'Square',
    nullable: true,
    description: 'The square the moves were filtered to, or null when every legal move is returned.'
  })
  square!: Square | null;

  @ApiProperty({ type: [MoveDto] })
  moves!: MoveDto[];
}
