import { Chess } from 'chess.js';
import { deriveOutcome, isFinished, timeoutOutcome } from '../game-outcome.js';
import { DrawReason, GameResult, GameStatus, PlayerColor } from '../game.types.js';

describe('deriveOutcome', () => {
  it('reports an untouched board as in progress', () => {
    expect(deriveOutcome(new Chess())).toEqual({ status: GameStatus.IN_PROGRESS, result: null, drawReason: null });
  });

  it('awards the win to black when white is mated', () => {
    // Fool's mate — white to move and mated.
    const chess = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.CHECKMATE, result: GameResult.BLACK_WINS, drawReason: null });
  });

  it('awards the win to white when black is mated', () => {
    // Scholar's mate — black to move and mated.
    const chess = new Chess('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4');

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.CHECKMATE, result: GameResult.WHITE_WINS, drawReason: null });
  });

  it('reports stalemate with no draw reason', () => {
    const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.STALEMATE, result: GameResult.DRAW, drawReason: null });
  });

  it('reports insufficient material', () => {
    const chess = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.INSUFFICIENT_MATERIAL });
  });

  it('reports the fifty-move rule', () => {
    const chess = new Chess('8/8/8/4k3/8/4K3/8/R7 w - - 100 200');

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.FIFTY_MOVE_RULE });
  });

  it('reports threefold repetition', () => {
    const chess = new Chess();
    for (const san of ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']) chess.move(san);

    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.THREEFOLD_REPETITION });
  });

  it('prefers checkmate over the fifty-move rule', () => {
    // Mate delivered on the 100th halfmove — FIDE gives checkmate precedence.
    const chess = new Chess('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 100 60');

    expect(chess.isDrawByFiftyMoves()).toBe(true);
    expect(deriveOutcome(chess)).toEqual({ status: GameStatus.CHECKMATE, result: GameResult.WHITE_WINS, drawReason: null });
  });
});

describe('timeoutOutcome', () => {
  it('awards the win to the side that still has time', () => {
    expect(timeoutOutcome(new Chess(), PlayerColor.WHITE)).toEqual({ status: GameStatus.TIMEOUT, result: GameResult.BLACK_WINS, drawReason: null });
    expect(timeoutOutcome(new Chess(), PlayerColor.BLACK)).toEqual({ status: GameStatus.TIMEOUT, result: GameResult.WHITE_WINS, drawReason: null });
  });

  it('draws when the opponent is down to a lone king', () => {
    const chess = new Chess('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');

    expect(timeoutOutcome(chess, PlayerColor.WHITE)).toEqual({ status: GameStatus.TIMEOUT, result: GameResult.DRAW, drawReason: DrawReason.INSUFFICIENT_MATERIAL });
  });

  it('draws when the opponent holds a single minor piece', () => {
    const knight = new Chess('4k3/8/8/8/8/8/8/3NK3 w - - 0 1');
    const bishop = new Chess('4k3/8/8/8/8/8/8/3BK3 w - - 0 1');

    expect(timeoutOutcome(knight, PlayerColor.BLACK).result).toBe(GameResult.DRAW);
    expect(timeoutOutcome(bishop, PlayerColor.BLACK).result).toBe(GameResult.DRAW);
  });

  // FIDE asks whether mate is possible at all, not whether it can be forced, and two knights can mate with help.
  it('awards the win on two knights', () => {
    const chess = new Chess('4k3/8/8/8/8/8/8/2N1KN2 w - - 0 1');

    expect(timeoutOutcome(chess, PlayerColor.BLACK)).toEqual({ status: GameStatus.TIMEOUT, result: GameResult.WHITE_WINS, drawReason: null });
  });

  it('awards the win on a lone pawn, which can promote', () => {
    const chess = new Chess('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');

    expect(timeoutOutcome(chess, PlayerColor.BLACK).result).toBe(GameResult.WHITE_WINS);
  });
});

describe('isFinished', () => {
  it('is false only while in progress', () => {
    expect(isFinished(deriveOutcome(new Chess()))).toBe(false);
    expect(isFinished(deriveOutcome(new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1')))).toBe(true);
  });
});
