import { Chess } from 'chess.js';
import { deriveOutcome, isFinished } from '../game-outcome.js';
import { DrawReason, GameResult, GameStatus } from '../game.types.js';

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

describe('isFinished', () => {
  it('is false only while in progress', () => {
    expect(isFinished(deriveOutcome(new Chess()))).toBe(false);
    expect(isFinished(deriveOutcome(new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1')))).toBe(true);
  });
});
