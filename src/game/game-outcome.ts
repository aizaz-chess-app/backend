import { Chess } from 'chess.js';
import { DrawReason, GameOutcome, GameResult, GameStatus, IN_PROGRESS_OUTCOME, PlayerColor } from './game.types.js';

// Derives the outcome from the position alone. Resignations and agreed draws
// are not visible here — the service stores those on the record instead.
export function deriveOutcome(chess: Chess): GameOutcome {
  if (chess.isCheckmate()) {
    // The side to move has been mated, so the other side won.
    return { status: GameStatus.CHECKMATE, result: chess.turn() === PlayerColor.WHITE ? GameResult.BLACK_WINS : GameResult.WHITE_WINS, drawReason: null };
  }

  if (chess.isStalemate()) {
    return { status: GameStatus.STALEMATE, result: GameResult.DRAW, drawReason: null };
  }

  // Checked ahead of the isDraw() umbrella, since these are what supply the reason.
  if (chess.isThreefoldRepetition()) {
    return { status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.THREEFOLD_REPETITION };
  }

  if (chess.isInsufficientMaterial()) {
    return { status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.INSUFFICIENT_MATERIAL };
  }

  if (chess.isDrawByFiftyMoves()) {
    return { status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.FIFTY_MOVE_RULE };
  }

  return IN_PROGRESS_OUTCOME;
}

export function isFinished(outcome: GameOutcome): boolean {
  return outcome.status !== GameStatus.IN_PROGRESS;
}
