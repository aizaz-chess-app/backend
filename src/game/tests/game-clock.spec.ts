import { chargeMove, createClock, hasFlagged, liveRemaining } from '../game-clock.js';
import { PlayerColor, type TimeControl } from '../game.types.js';

const FIVE_PLUS_THREE: TimeControl = { initialMs: 300_000, incrementMs: 3_000 };
const START = 1_000_000;

describe('game clock', () => {
  describe('createClock', () => {
    it('banks the full initial time for both sides', () => {
      const clock = createClock(FIVE_PLUS_THREE, START);

      expect(clock.remaining).toEqual({ [PlayerColor.WHITE]: 300_000, [PlayerColor.BLACK]: 300_000 });
      expect(clock.turnStartedAt).toBe(START);
    });
  });

  describe('liveRemaining', () => {
    it('charges elapsed time to the side to move and leaves the other banked', () => {
      const clock = createClock(FIVE_PLUS_THREE, START);

      expect(liveRemaining(clock, PlayerColor.WHITE, START + 10_000)).toEqual({ [PlayerColor.WHITE]: 290_000, [PlayerColor.BLACK]: 300_000 });
      expect(liveRemaining(clock, PlayerColor.BLACK, START + 10_000)).toEqual({ [PlayerColor.WHITE]: 300_000, [PlayerColor.BLACK]: 290_000 });
    });

    it('clamps at zero rather than going negative', () => {
      const clock = createClock(FIVE_PLUS_THREE, START);

      expect(liveRemaining(clock, PlayerColor.WHITE, START + 400_000)[PlayerColor.WHITE]).toBe(0);
    });

    it('does not credit time for a `now` before the turn began', () => {
      const clock = createClock(FIVE_PLUS_THREE, START);

      expect(liveRemaining(clock, PlayerColor.WHITE, START - 10_000)[PlayerColor.WHITE]).toBe(300_000);
    });
  });

  describe('hasFlagged', () => {
    it('is false with time to spare and true once the bank is spent', () => {
      const clock = createClock({ initialMs: 5_000, incrementMs: 0 }, START);

      expect(hasFlagged(clock, PlayerColor.WHITE, START + 4_999)).toBe(false);
      expect(hasFlagged(clock, PlayerColor.WHITE, START + 5_000)).toBe(true);
    });

    it('only looks at the side to move', () => {
      const clock = createClock({ initialMs: 5_000, incrementMs: 0 }, START);

      expect(hasFlagged(clock, PlayerColor.BLACK, START + 10_000)).toBe(true);
      expect(liveRemaining(clock, PlayerColor.BLACK, START + 10_000)[PlayerColor.WHITE]).toBe(5_000);
    });
  });

  describe('chargeMove', () => {
    it('debits the mover, adds the increment and restarts the turn', () => {
      const clock = chargeMove(createClock(FIVE_PLUS_THREE, START), PlayerColor.WHITE, START + 10_000);

      expect(clock.remaining).toEqual({ [PlayerColor.WHITE]: 293_000, [PlayerColor.BLACK]: 300_000 });
      expect(clock.turnStartedAt).toBe(START + 10_000);
    });

    it('leaves the original clock untouched', () => {
      const before = createClock(FIVE_PLUS_THREE, START);
      chargeMove(before, PlayerColor.WHITE, START + 10_000);

      expect(before.remaining[PlayerColor.WHITE]).toBe(300_000);
      expect(before.turnStartedAt).toBe(START);
    });

    it('can leave a side with more time than it started with', () => {
      const clock = chargeMove(createClock(FIVE_PLUS_THREE, START), PlayerColor.WHITE, START + 1_000);

      expect(clock.remaining[PlayerColor.WHITE]).toBe(302_000);
    });
  });
});
