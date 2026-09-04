import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { HealthResponseDto } from './health-response.dto.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 whenever the process is serving requests.' })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
