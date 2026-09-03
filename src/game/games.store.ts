import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Chess } from 'chess.js';
import { GameRecord } from './game.types.js';

export const GAME_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const FINISHED_GAME_TTL_MS = 10 * 60 * 1000; // 10m
export const MAX_GAMES = 5000;

// In-memory only: games are lost on restart. Holds no chess logic.
@Injectable()
export class GamesStore {
  private readonly games = new Map<string, GameRecord>();

  create(): GameRecord {
    this.evictStale();

    const now = new Date();
    const record: GameRecord = { id: randomUUID(), chess: new Chess(), outcome: null, finishedAt: null, createdAt: now, updatedAt: now };

    this.games.set(record.id, record);
    return record;
  }

  find(id: string): GameRecord | undefined {
    return this.games.get(id);
  }

  touch(record: GameRecord): GameRecord {
    record.updatedAt = new Date();
    this.games.delete(record.id);
    this.games.set(record.id, record);
    return record;
  }

  delete(id: string): boolean {
    return this.games.delete(id);
  }

  get size(): number {
    return this.games.size;
  }

  // Swept on write rather than on a timer, which would hold the event loop
  // open and force fake timers into every test.
  private evictStale(): void {
    const now = Date.now();

    for (const [id, record] of this.games) {
      // Finished games are aged from when they ended, not last touched.
      const since = record.finishedAt ?? record.updatedAt;
      const ttl = record.finishedAt ? FINISHED_GAME_TTL_MS : GAME_TTL_MS;

      if (now - since.getTime() > ttl) this.games.delete(id);
    }

    // Map preserves insertion order, and touch() re-inserts, so the oldest
    // entries are the least recently used.
    for (const id of this.games.keys()) {
      if (this.games.size < MAX_GAMES) break;
      this.games.delete(id);
    }
  }
}
