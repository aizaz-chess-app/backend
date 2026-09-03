import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { GameStateDto, LegalMovesDto } from './dto/game-state.dto.js';
import { LegalMovesQueryDto } from './dto/legal-moves-query.dto.js';
import { MakeMoveDto } from './dto/make-move.dto.js';
import { ResignDto } from './dto/resign.dto.js';
import { GameService } from './game.service.js';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  createGame(): GameStateDto {
    return this.gameService.createGame();
  }

  @Get(':id')
  getGame(@Param('id') id: string): GameStateDto {
    return this.gameService.getGame(id);
  }

  @Post(':id/moves')
  @HttpCode(HttpStatus.OK)
  makeMove(@Param('id') id: string, @Body() dto: MakeMoveDto): GameStateDto {
    return this.gameService.makeMove(id, dto);
  }

  @Get(':id/moves')
  getLegalMoves(@Param('id') id: string, @Query() query: LegalMovesQueryDto): LegalMovesDto {
    return this.gameService.getLegalMoves(id, query.square);
  }

  @Post(':id/resign')
  @HttpCode(HttpStatus.OK)
  resign(@Param('id') id: string, @Body() dto: ResignDto): GameStateDto {
    return this.gameService.resign(id, dto.color);
  }

  @Post(':id/draw')
  @HttpCode(HttpStatus.OK)
  agreeDraw(@Param('id') id: string): GameStateDto {
    return this.gameService.agreeDraw(id);
  }
}
