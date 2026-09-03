import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_POSITION } from 'chess.js';
import type { GameStateDto } from '../dto/game-state.dto.js';
import { GameService } from '../game.service.js';
import { DrawReason, GameResult, GameStatus, PlayerColor } from '../game.types.js';
import { GamesStore } from '../games.store.js';

const FOOLS_MATE = [
  { from: 'f2', to: 'f3' },
  { from: 'e7', to: 'e5' },
  { from: 'g2', to: 'g4' },
  { from: 'd8', to: 'h4' }
] as const;

describe('GameService', () => {
  let service: GameService;
  let store: GamesStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, GamesStore]
    }).compile();

    service = module.get<GameService>(GameService);
    store = module.get<GamesStore>(GamesStore);
  });

  const playFoolsMate = (id: string): GameStateDto => {
    let state!: GameStateDto;
    for (const move of FOOLS_MATE) state = service.makeMove(id, { ...move });
    return state;
  };

  describe('createGame', () => {
    it('starts from the initial position with white to move', () => {
      const game = service.createGame();

      expect(game.fen).toBe(DEFAULT_POSITION);
      expect(game.turn).toBe(PlayerColor.WHITE);
      expect(game.status).toBe(GameStatus.IN_PROGRESS);
      expect(game.result).toBeNull();
      expect(game.drawReason).toBeNull();
      expect(game.history).toEqual([]);
      expect(game.moveNumber).toBe(1);
      expect(game.inCheck).toBe(false);
    });

    it('gives each game its own id and board', () => {
      const first = service.createGame();
      const second = service.createGame();

      expect(first.id).not.toBe(second.id);

      service.makeMove(first.id, { from: 'e2', to: 'e4' });

      expect(service.getGame(second.id).fen).toBe(DEFAULT_POSITION);
    });
  });

  describe('getGame', () => {
    it('throws NotFound for an unknown id', () => {
      expect(() => service.getGame('does-not-exist')).toThrow(NotFoundException);
    });

    it('returns the stored game', () => {
      const { id } = service.createGame();

      expect(service.getGame(id).id).toBe(id);
    });
  });

  describe('makeMove', () => {
    it('advances the turn and records history', () => {
      const { id } = service.createGame();

      const state = service.makeMove(id, { from: 'e2', to: 'e4' });

      expect(state.turn).toBe(PlayerColor.BLACK);
      expect(state.fen).not.toBe(DEFAULT_POSITION);
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toMatchObject({ san: 'e4', from: 'e2', to: 'e4', color: PlayerColor.WHITE });
      expect(state.pgn).toContain('e4');
    });

    it('rejects an illegal move and leaves the position untouched', () => {
      const { id } = service.createGame();

      expect(() => service.makeMove(id, { from: 'e2', to: 'e5' })).toThrow(BadRequestException);

      const state = service.getGame(id);
      expect(state.fen).toBe(DEFAULT_POSITION);
      expect(state.turn).toBe(PlayerColor.WHITE);
      expect(state.history).toEqual([]);
    });

    it('rejects moving out of turn', () => {
      const { id } = service.createGame();

      // Black's pawn, but it is white to move.
      expect(() => service.makeMove(id, { from: 'e7', to: 'e5' })).toThrow(BadRequestException);
    });

    it('throws NotFound for an unknown id', () => {
      expect(() => service.makeMove('nope', { from: 'e2', to: 'e4' })).toThrow(NotFoundException);
    });

    it('honours a promotion choice', () => {
      const { id } = service.createGame();
      const record = store.find(id)!;
      record.chess.load('8/P6k/8/8/8/8/8/7K w - - 0 1');

      const state = service.makeMove(id, { from: 'a7', to: 'a8', promotion: 'n' });

      expect(state.history.at(-1)).toMatchObject({ san: 'a8=N', promotion: 'n' });
    });

    it('reports checkmate and the winner', () => {
      const { id } = service.createGame();

      const state = playFoolsMate(id);

      expect(state.status).toBe(GameStatus.CHECKMATE);
      expect(state.result).toBe(GameResult.BLACK_WINS);
      expect(state.inCheck).toBe(true);
    });

    it('refuses further moves once the game is over', () => {
      const { id } = service.createGame();
      playFoolsMate(id);

      expect(() => service.makeMove(id, { from: 'e2', to: 'e4' })).toThrow(ConflictException);
    });
  });

  describe('getLegalMoves', () => {
    it('lists every legal move when no square is given', () => {
      const { id } = service.createGame();

      const { square, moves } = service.getLegalMoves(id);

      expect(square).toBeNull();
      expect(moves).toHaveLength(20);
    });

    it('filters to a single origin square', () => {
      const { id } = service.createGame();

      const { square, moves } = service.getLegalMoves(id, 'e2');

      expect(square).toBe('e2');
      expect(moves.map(move => move.to).sort()).toEqual(['e3', 'e4']);
    });

    it('returns an empty list for an empty square rather than throwing', () => {
      const { id } = service.createGame();

      expect(service.getLegalMoves(id, 'e4').moves).toEqual([]);
    });

    it('throws NotFound for an unknown id', () => {
      expect(() => service.getLegalMoves('nope')).toThrow(NotFoundException);
    });
  });

  describe('resign', () => {
    it('hands the win to the opponent', () => {
      const { id } = service.createGame();

      const state = service.resign(id, PlayerColor.WHITE);

      expect(state.status).toBe(GameStatus.RESIGNED);
      expect(state.result).toBe(GameResult.BLACK_WINS);
    });

    it('hands the win to white when black resigns', () => {
      const { id } = service.createGame();

      expect(service.resign(id, PlayerColor.BLACK).result).toBe(GameResult.WHITE_WINS);
    });

    it('survives a re-read, since chess.js cannot represent it', () => {
      const { id } = service.createGame();
      service.resign(id, PlayerColor.WHITE);

      expect(service.getGame(id).status).toBe(GameStatus.RESIGNED);
      expect(service.getGame(id).result).toBe(GameResult.BLACK_WINS);
    });

    it('blocks later moves and a second resignation', () => {
      const { id } = service.createGame();
      service.resign(id, PlayerColor.WHITE);

      expect(() => service.makeMove(id, { from: 'e2', to: 'e4' })).toThrow(ConflictException);
      expect(() => service.resign(id, PlayerColor.BLACK)).toThrow(ConflictException);
    });

    it('cannot override a checkmate', () => {
      const { id } = service.createGame();
      playFoolsMate(id);

      expect(() => service.resign(id, PlayerColor.BLACK)).toThrow(ConflictException);
      expect(service.getGame(id).status).toBe(GameStatus.CHECKMATE);
    });
  });

  describe('agreeDraw', () => {
    it('ends the game as a draw by agreement', () => {
      const { id } = service.createGame();

      const state = service.agreeDraw(id);

      expect(state.status).toBe(GameStatus.DRAW);
      expect(state.result).toBe(GameResult.DRAW);
      expect(state.drawReason).toBe(DrawReason.AGREEMENT);
    });

    it('blocks later moves', () => {
      const { id } = service.createGame();
      service.agreeDraw(id);

      expect(() => service.makeMove(id, { from: 'e2', to: 'e4' })).toThrow(ConflictException);
    });
  });

  describe('finishedAt', () => {
    it('is stamped once the game ends, so the store can expire it early', () => {
      const { id } = service.createGame();
      expect(store.find(id)!.finishedAt).toBeNull();

      playFoolsMate(id);

      expect(store.find(id)!.finishedAt).toBeInstanceOf(Date);
    });

    it('is not re-stamped on subsequent reads', () => {
      const { id } = service.createGame();
      service.agreeDraw(id);
      const stampedAt = store.find(id)!.finishedAt;

      service.getGame(id);

      expect(store.find(id)!.finishedAt).toBe(stampedAt);
    });
  });
});
