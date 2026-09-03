import type { PieceSymbol, Square } from 'chess.js';
import type { DrawReason, GameResult, GameStatus, PlayerColor, PromotionPiece } from '../game.types.js';

export type MoveDto = {
  san: string;
  lan: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: PlayerColor;
  captured?: PieceSymbol;
  promotion?: PromotionPiece;
};

export type GameStateDto = {
  id: string;
  fen: string;
  pgn: string;
  turn: PlayerColor;
  moveNumber: number;
  inCheck: boolean;
  status: GameStatus;
  result: GameResult | null;
  drawReason: DrawReason | null;
  history: MoveDto[];
  createdAt: string;
  updatedAt: string;
};

export type LegalMovesDto = {
  square: Square | null;
  moves: MoveDto[];
};
