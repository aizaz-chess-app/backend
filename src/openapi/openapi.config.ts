import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { ValidationErrorResponseDto } from '../common/dto/error-response.dto.js';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Chess App API')
    .setDescription('HTTP API for the chess app backend.')
    .setVersion('0.0.1')
    .addServer('/', 'Same origin as these docs')
    .addServer('http://localhost:3000', 'Local development')
    // Every route runs the same ValidationPipe, so the shape is documented once here. A route declaring its own 400 overrides this one.
    .addGlobalResponse({
      status: 400,
      type: ValidationErrorResponseDto,
      description: 'The payload failed validation.'
    })
    .build();

  return SwaggerModule.createDocument(app, config, { operationIdFactory: (_controllerKey, methodKey) => methodKey });
}
