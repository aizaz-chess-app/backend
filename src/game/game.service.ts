import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Move, Square } from 'chess.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { GameStateDto, LegalMovesDto, MoveDto } from './dto/game-state.dto.js';
import { MakeMoveDto } from './dto/make-move.dto.js';
import { chargeMove, createClock, hasFlagged, liveRemaining } from './game-clock.js';
import { deriveOutcome, isFinished, timeoutOutcome } from './game-outcome.js';
import { DrawReason, GameOutcome, GameRecord, GameResult, GameStatus, PlayerColor } from './game.types.js';
import { GamesStore } from './games.store.js';

@Injectable()
export class GameService {
  constructor(private readonly store: GamesStore) {}

  createGame(dto: CreateGameDto = {}): GameStateDto {
    const now = Date.now();
    const { timeControl } = dto;
    const clock = timeControl ? createClock({ initialMs: timeControl.initialSeconds * 1000, incrementMs: timeControl.incrementSeconds * 1000 }, now) : null;

    return this.toGameStateDto(this.store.create(clock), now);
  }

  getGame(id: string): GameStateDto {
    return this.toGameStateDto(this.findOrThrow(id));
  }

  makeMove(id: string, dto: MakeMoveDto): GameStateDto {
    const record = this.findOrThrow(id);
    const now = Date.now();
    this.assertPlayable(record, now);

    // chess.turn() flips once the move lands, so the side being charged has to be read first.
    const mover = record.chess.turn();

    try {
      record.chess.move({ from: dto.from, to: dto.to, promotion: dto.promotion });
    } catch {
      // chess.js throws on an illegal move rather than returning null. The clock is untouched: a rejected move costs no time.
      throw new BadRequestException(`Illegal move ${dto.from}-${dto.to} for the current position`);
    }

    if (record.clock) record.clock = chargeMove(record.clock, mover, now);

    return this.toGameStateDto(this.store.touch(record), now);
  }

  getLegalMoves(id: string, square?: Square): LegalMovesDto {
    const record = this.findOrThrow(id);
    const moves = square ? record.chess.moves({ verbose: true, square }) : record.chess.moves({ verbose: true });

    return { square: square ?? null, moves: moves.map(move => this.toMoveDto(move)) };
  }

  resign(id: string, color: PlayerColor): GameStateDto {
    const record = this.findOrThrow(id);
    this.assertPlayable(record, Date.now());

    record.outcome = {
      status: GameStatus.RESIGNED,
      result: color === PlayerColor.WHITE ? GameResult.BLACK_WINS : GameResult.WHITE_WINS,
      drawReason: null
    };

    return this.toGameStateDto(this.store.touch(record));
  }

  agreeDraw(id: string): GameStateDto {
    const record = this.findOrThrow(id);
    this.assertPlayable(record, Date.now());

    record.outcome = { status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.AGREEMENT };

    return this.toGameStateDto(this.store.touch(record));
  }

  private findOrThrow(id: string): GameRecord {
    const record = this.store.find(id);
    if (!record) throw new NotFoundException(`Game ${id} not found`);
    return record;
  }

  private assertPlayable(record: GameRecord, now: number): void {
    const outcome = this.gameOutcome(record, now);
    if (isFinished(outcome)) throw new ConflictException(`Game is already over (${outcome.status})`);
  }

  // An explicit resignation, agreed draw or flag always wins over the board position.
  private gameOutcome(record: GameRecord, now: number): GameOutcome {
    const turn = record.chess.turn();

    if (!record.outcome && record.clock && hasFlagged(record.clock, turn, now)) record.outcome = timeoutOutcome(record.chess, turn);

    const outcome = record.outcome ?? deriveOutcome(record.chess);

    // Guarding on finishedAt keeps the freeze idempotent, so a later read cannot debit the clock a second time.
    if (isFinished(outcome) && !record.finishedAt) {
      record.finishedAt = new Date();
      if (record.clock) record.clock = { ...record.clock, remaining: liveRemaining(record.clock, turn, now) };
    }

    return outcome;
  }

  private toMoveDto(move: Move): MoveDto {
    return {
      san: move.san,
      lan: move.lan,
      from: move.from,
      to: move.to,
      piece: move.piece,
      color: move.color,
      ...(move.captured ? { captured: move.captured } : {}),
      ...(move.promotion ? { promotion: move.promotion } : {})
    } as MoveDto;
  }

  private toGameStateDto(record: GameRecord, now = Date.now()): GameStateDto {
    const { chess } = record;
    const outcome = this.gameOutcome(record, now);
    // Read after gameOutcome(), which replaces the clock with a frozen copy once the game ends - re-interpolating that would keep draining the loser.
    const { clock } = record;
    const remaining = clock ? (record.finishedAt ? clock.remaining : liveRemaining(clock, chess.turn(), now)) : null;

    return {
      id: record.id,
      fen: chess.fen(),
      pgn: chess.pgn(),
      turn: chess.turn(),
      moveNumber: chess.moveNumber(),
      inCheck: chess.inCheck(),
      status: outcome.status,
      result: outcome.result,
      drawReason: outcome.drawReason,
      history: chess.history({ verbose: true }).map(move => this.toMoveDto(move)),
      timeControl: clock ? { initialSeconds: clock.timeControl.initialMs / 1000, incrementSeconds: clock.timeControl.incrementMs / 1000 } : null,
      clock: remaining ? { whiteMs: remaining[PlayerColor.WHITE], blackMs: remaining[PlayerColor.BLACK], serverTime: new Date(now).toISOString() } : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }
}
