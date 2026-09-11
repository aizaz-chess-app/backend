import { GameClock, PlayerColor, TimeControl } from './game.types.js';

// `now` is always passed in rather than read, so every clock rule is testable without faking time.

export function createClock(timeControl: TimeControl, now: number): GameClock {
  return {
    timeControl,
    remaining: { [PlayerColor.WHITE]: timeControl.initialMs, [PlayerColor.BLACK]: timeControl.initialMs },
    turnStartedAt: now
  };
}

export function liveRemaining(clock: GameClock, turn: PlayerColor, now: number): Record<PlayerColor, number> {
  const elapsed = Math.max(0, now - clock.turnStartedAt);

  return { ...clock.remaining, [turn]: Math.max(0, clock.remaining[turn] - elapsed) };
}

export function hasFlagged(clock: GameClock, turn: PlayerColor, now: number): boolean {
  return liveRemaining(clock, turn, now)[turn] === 0;
}

// Fischer: the increment lands after the move, so it is added to what is left rather than to what was banked.
export function chargeMove(clock: GameClock, mover: PlayerColor, now: number): GameClock {
  const remaining = liveRemaining(clock, mover, now);

  return {
    ...clock,
    remaining: { ...remaining, [mover]: remaining[mover] + clock.timeControl.incrementMs },
    turnStartedAt: now
  };
}
