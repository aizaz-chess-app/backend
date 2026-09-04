import { applyDecorators, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto, NotFoundErrorResponseDto, ValidationErrorResponseDto } from '../common/dto/error-response.dto.js';
import { GameStateDto, LegalMovesDto } from './dto/game-state.dto.js';
import { LegalMovesQueryDto } from './dto/legal-moves-query.dto.js';
import { MakeMoveDto } from './dto/make-move.dto.js';
import { ResignDto } from './dto/resign.dto.js';
import { GameService } from './game.service.js';

const GAME_NOT_FOUND = 'No game found with this id.';
const GAME_OVER = 'The game has already ended, so it can no longer be played.';

// Applied per route rather than to the class, so POST /games is not documented with an id it does not take.
const ApiGameId = () =>
  applyDecorators(
    ApiParam({ name: 'id', format: 'uuid', description: 'Game id returned by POST /games.' }),
    ApiNotFoundResponse({ type: NotFoundErrorResponseDto, description: GAME_NOT_FOUND })
  );

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @ApiOperation({ summary: 'Start a game', description: 'Creates a hotseat game at the standard starting position.' })
  @ApiCreatedResponse({ type: GameStateDto })
  createGame(): GameStateDto {
    return this.gameService.createGame();
  }

  @Get(':id')
  @ApiGameId()
  @ApiOperation({ summary: 'Read the current game state' })
  @ApiOkResponse({ type: GameStateDto })
  getGame(@Param('id') id: string): GameStateDto {
    return this.gameService.getGame(id);
  }

  @Post(':id/moves')
  @HttpCode(HttpStatus.OK)
  @ApiGameId()
  @ApiOperation({
    summary: 'Play a move',
    description: 'Plays a move for the side to move. There is no player identity, so either side can be moved.'
  })
  @ApiOkResponse({ type: GameStateDto })
  @ApiBadRequestResponse({
    type: ValidationErrorResponseDto,
    description: 'Malformed payload (`message` is an array), or a well-formed but illegal move for the position (`message` is a string).'
  })
  @ApiConflictResponse({ type: ErrorResponseDto, description: GAME_OVER })
  makeMove(@Param('id') id: string, @Body() dto: MakeMoveDto): GameStateDto {
    return this.gameService.makeMove(id, dto);
  }

  @Get(':id/moves')
  @ApiGameId()
  @ApiOperation({
    summary: 'List legal moves',
    description: 'An empty or opponent-occupied square yields an empty list rather than an error.'
  })
  @ApiOkResponse({ type: LegalMovesDto })
  @ApiBadRequestResponse({ type: ValidationErrorResponseDto, description: 'The `square` query parameter is not a square.' })
  getLegalMoves(@Param('id') id: string, @Query() query: LegalMovesQueryDto): LegalMovesDto {
    return this.gameService.getLegalMoves(id, query.square);
  }

  @Post(':id/resign')
  @HttpCode(HttpStatus.OK)
  @ApiGameId()
  @ApiOperation({ summary: 'Resign', description: 'Ends the game; the side that did not resign wins.' })
  @ApiOkResponse({ type: GameStateDto })
  @ApiBadRequestResponse({ type: ValidationErrorResponseDto, description: '`color` is not `w` or `b`.' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: GAME_OVER })
  resign(@Param('id') id: string, @Body() dto: ResignDto): GameStateDto {
    return this.gameService.resign(id, dto.color);
  }

  @Post(':id/draw')
  @HttpCode(HttpStatus.OK)
  @ApiGameId()
  @ApiOperation({ summary: 'Agree a draw', description: 'Both players are on one client, so this takes no body.' })
  @ApiOkResponse({ type: GameStateDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: GAME_OVER })
  agreeDraw(@Param('id') id: string): GameStateDto {
    return this.gameService.agreeDraw(id);
  }
}
