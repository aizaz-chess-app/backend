import { DEFAULT_POSITION } from 'chess.js';
import { FINISHED_GAME_TTL_MS, GAME_TTL_MS, GamesStore } from '../games.store.js';

describe('GamesStore', () => {
  let store: GamesStore;

  beforeEach(() => {
    store = new GamesStore();
  });

  const ageTo = (id: string, ms: number): void => {
    const record = store.find(id)!;
    record.updatedAt = new Date(Date.now() - ms);
    if (record.finishedAt) record.finishedAt = new Date(Date.now() - ms);
  };

  it('creates games with a fresh board and a unique id', () => {
    const first = store.create();
    const second = store.create();

    expect(first.chess.fen()).toBe(DEFAULT_POSITION);
    expect(first.outcome).toBeNull();
    expect(first.finishedAt).toBeNull();
    expect(first.id).not.toBe(second.id);
    expect(store.size).toBe(2);
  });

  it('finds and deletes by id', () => {
    const { id } = store.create();

    expect(store.find(id)?.id).toBe(id);
    expect(store.delete(id)).toBe(true);
    expect(store.find(id)).toBeUndefined();
    expect(store.delete(id)).toBe(false);
  });

  it('evicts in-progress games past the TTL on the next create', () => {
    const stale = store.create();
    const fresh = store.create();
    ageTo(stale.id, GAME_TTL_MS + 1000);

    store.create();

    expect(store.find(stale.id)).toBeUndefined();
    expect(store.find(fresh.id)).toBeDefined();
  });

  it('keeps in-progress games that are still inside the TTL', () => {
    const recent = store.create();
    ageTo(recent.id, GAME_TTL_MS - 60_000);

    store.create();

    expect(store.find(recent.id)).toBeDefined();
  });

  it('expires finished games on the shorter TTL', () => {
    const finished = store.create();
    finished.finishedAt = new Date();
    // Old enough for the finished TTL, nowhere near the in-progress one.
    ageTo(finished.id, FINISHED_GAME_TTL_MS + 1000);

    store.create();

    expect(store.find(finished.id)).toBeUndefined();
  });

  it('keeps a recently finished game so the post-game screen can still read it', () => {
    const finished = store.create();
    finished.finishedAt = new Date();
    ageTo(finished.id, FINISHED_GAME_TTL_MS - 60_000);

    store.create();

    expect(store.find(finished.id)).toBeDefined();
  });

  it('moves a touched game to the back of the eviction queue', () => {
    const first = store.create();
    const second = store.create();

    store.touch(first);

    expect([...(store as unknown as { games: Map<string, unknown> }).games.keys()]).toEqual([second.id, first.id]);
  });
});
