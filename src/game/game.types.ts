import { BISHOP, BLACK, Chess, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE, type Color, type PieceSymbol } from 'chess.js';

export const GameStatus = {
  IN_PROGRESS: 'in_progress',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  DRAW: 'draw',
  RESIGNED: 'resigned'
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const GameResult = {
  WHITE_WINS: '1-0',
  BLACK_WINS: '0-1',
  DRAW: '1/2-1/2'
} as const;
export type GameResult = (typeof GameResult)[keyof typeof GameResult];

export const DrawReason = {
  THREEFOLD_REPETITION: 'threefold_repetition',
  INSUFFICIENT_MATERIAL: 'insufficient_material',
  FIFTY_MOVE_RULE: 'fifty_move_rule',
  AGREEMENT: 'agreement'
} as const;
export type DrawReason = (typeof DrawReason)[keyof typeof DrawReason];

// Re-exported from chess.js so callers get colours and pieces from one place.
export const PlayerColor = { WHITE, BLACK } as const;
export type PlayerColor = Color;

export const PromotionPiece = { QUEEN, ROOK, BISHOP, KNIGHT } as const;
export type PromotionPiece = (typeof PromotionPiece)[keyof typeof PromotionPiece];

export const PieceType = { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } as const;
export type PieceType = PieceSymbol;

export type GameOutcome = {
  status: GameStatus;
  result: GameResult | null;
  drawReason: DrawReason | null;
};

// A game that is still running.
export const IN_PROGRESS_OUTCOME: GameOutcome = Object.freeze({
  status: GameStatus.IN_PROGRESS,
  result: null,
  drawReason: null
});

export type GameRecord = {
  id: string;
  chess: Chess;
  outcome: GameOutcome | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
