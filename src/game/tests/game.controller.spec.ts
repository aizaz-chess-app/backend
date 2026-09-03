import { Test, TestingModule } from '@nestjs/testing';
import type { GameStateDto } from '../dto/game-state.dto.js';
import { GameController } from '../game.controller.js';
import { GameService } from '../game.service.js';
import { PlayerColor } from '../game.types.js';

const state = { id: 'game-1' } as GameStateDto;

describe('GameController', () => {
  let controller: GameController;
  let service: {
    createGame: ReturnType<typeof vi.fn>;
    getGame: ReturnType<typeof vi.fn>;
    makeMove: ReturnType<typeof vi.fn>;
    getLegalMoves: ReturnType<typeof vi.fn>;
    resign: ReturnType<typeof vi.fn>;
    agreeDraw: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      createGame: vi.fn().mockReturnValue(state),
      getGame: vi.fn().mockReturnValue(state),
      makeMove: vi.fn().mockReturnValue(state),
      getLegalMoves: vi.fn().mockReturnValue({ square: null, moves: [] }),
      resign: vi.fn().mockReturnValue(state),
      agreeDraw: vi.fn().mockReturnValue(state)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController]
    })
      .useMocker(token => (token === GameService ? service : undefined))
      .compile();

    controller = module.get<GameController>(GameController);
  });

  it('creates a game', () => {
    expect(controller.createGame()).toBe(state);
    expect(service.createGame).toHaveBeenCalledOnce();
  });

  it('reads a game by id', () => {
    expect(controller.getGame('game-1')).toBe(state);
    expect(service.getGame).toHaveBeenCalledWith('game-1');
  });

  it('passes the move payload straight through', () => {
    const dto = { from: 'e2', to: 'e4' } as const;

    expect(controller.makeMove('game-1', { ...dto })).toBe(state);
    expect(service.makeMove).toHaveBeenCalledWith('game-1', dto);
  });

  it('forwards the optional square filter', () => {
    controller.getLegalMoves('game-1', { square: 'e2' });
    expect(service.getLegalMoves).toHaveBeenCalledWith('game-1', 'e2');

    controller.getLegalMoves('game-1', {});
    expect(service.getLegalMoves).toHaveBeenCalledWith('game-1', undefined);
  });

  it('unwraps the resigning colour', () => {
    expect(controller.resign('game-1', { color: PlayerColor.WHITE })).toBe(state);
    expect(service.resign).toHaveBeenCalledWith('game-1', PlayerColor.WHITE);
  });

  it('agrees a draw', () => {
    expect(controller.agreeDraw('game-1')).toBe(state);
    expect(service.agreeDraw).toHaveBeenCalledWith('game-1');
  });
});
