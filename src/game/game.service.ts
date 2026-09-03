import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Move, Square } from 'chess.js';
import { GameStateDto, LegalMovesDto, MoveDto } from './dto/game-state.dto.js';
import { MakeMoveDto } from './dto/make-move.dto.js';
import { deriveOutcome, isFinished } from './game-outcome.js';
import { DrawReason, GameOutcome, GameRecord, GameResult, GameStatus, PlayerColor } from './game.types.js';
import { GamesStore } from './games.store.js';

@Injectable()
export class GameService {
  constructor(private readonly store: GamesStore) {}

  createGame(): GameStateDto {
    return this.toGameStateDto(this.store.create());
  }

  getGame(id: string): GameStateDto {
    return this.toGameStateDto(this.findOrThrow(id));
  }

  makeMove(id: string, dto: MakeMoveDto): GameStateDto {
    const record = this.findOrThrow(id);
    this.assertPlayable(record);

    try {
      record.chess.move({ from: dto.from, to: dto.to, promotion: dto.promotion });
    } catch {
      // chess.js throws on an illegal move rather than returning null.
      throw new BadRequestException(`Illegal move ${dto.from}-${dto.to} for the current position`);
    }

    return this.toGameStateDto(this.store.touch(record));
  }

  getLegalMoves(id: string, square?: Square): LegalMovesDto {
    const record = this.findOrThrow(id);
    const moves = square ? record.chess.moves({ verbose: true, square }) : record.chess.moves({ verbose: true });

    return { square: square ?? null, moves: moves.map(move => this.toMoveDto(move)) };
  }

  resign(id: string, color: PlayerColor): GameStateDto {
    const record = this.findOrThrow(id);
    this.assertPlayable(record);

    record.outcome = {
      status: GameStatus.RESIGNED,
      result: color === PlayerColor.WHITE ? GameResult.BLACK_WINS : GameResult.WHITE_WINS,
      drawReason: null
    };

    return this.toGameStateDto(this.store.touch(record));
  }

  agreeDraw(id: string): GameStateDto {
    const record = this.findOrThrow(id);
    this.assertPlayable(record);

    record.outcome = { status: GameStatus.DRAW, result: GameResult.DRAW, drawReason: DrawReason.AGREEMENT };

    return this.toGameStateDto(this.store.touch(record));
  }

  private findOrThrow(id: string): GameRecord {
    const record = this.store.find(id);
    if (!record) throw new NotFoundException(`Game ${id} not found`);
    return record;
  }

  private assertPlayable(record: GameRecord): void {
    const outcome = this.gameOutcome(record);
    if (isFinished(outcome)) throw new ConflictException(`Game is already over (${outcome.status})`);
  }

  // An explicit resignation or agreed draw always wins over the board position.
  private gameOutcome(record: GameRecord): GameOutcome {
    const outcome = record.outcome ?? deriveOutcome(record.chess);
    if (isFinished(outcome)) record.finishedAt ??= new Date();
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

  private toGameStateDto(record: GameRecord): GameStateDto {
    const { chess } = record;
    const outcome = this.gameOutcome(record);

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
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }
}
