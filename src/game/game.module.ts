import { Module } from '@nestjs/common';
import { GameController } from './game.controller.js';
import { GameService } from './game.service.js';
import { GamesStore } from './games.store.js';

@Module({
  controllers: [GameController],
  providers: [GameService, GamesStore]
})
export class GameModule {}
