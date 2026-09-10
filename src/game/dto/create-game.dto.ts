import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { TimeControlDto } from './time-control.dto.js';

export class CreateGameDto {
  @ApiPropertyOptional({ type: TimeControlDto, description: 'Omit for an untimed game.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeControlDto)
  timeControl?: TimeControlDto;
}
