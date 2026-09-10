import { Chess } from 'chess.js';
import { DrawReason, GameOutcome, GameResult, GameStatus, IN_PROGRESS_OUTCOME, PieceType, PlayerColor } from './game.types.js';

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

// FIDE 6.9: flagging only loses if the opponent could still mate, otherwise the game is drawn.
export function timeoutOutcome(chess: Chess, flagged: PlayerColor): GameOutcome {
  const opponent = flagged === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;

  if (!hasMatingMaterial(chess, opponent)) {
    return { status: GameStatus.TIMEOUT, result: GameResult.DRAW, drawReason: DrawReason.INSUFFICIENT_MATERIAL };
  }

  return { status: GameStatus.TIMEOUT, result: opponent === PlayerColor.WHITE ? GameResult.WHITE_WINS : GameResult.BLACK_WINS, drawReason: null };
}

export function isFinished(outcome: GameOutcome): boolean {
  return outcome.status !== GameStatus.IN_PROGRESS;
}

// chess.js only answers this for the position as a whole, and the rule is per-side: a lone king or a king with a
// single minor cannot mate. Two knights can, with help, and FIDE asks whether mate is possible at all, not forced.
function hasMatingMaterial(chess: Chess, color: PlayerColor): boolean {
  let minors = 0;

  for (const piece of chess.board().flat()) {
    if (!piece || piece.color !== color) continue;

    if (piece.type === PieceType.BISHOP || piece.type === PieceType.KNIGHT) minors += 1;
    else if (piece.type !== PieceType.KING) return true;
  }

  return minors > 1;
}
