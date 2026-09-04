import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Chess App API')
    .setDescription('HTTP API for the chess app backend.')
    .setVersion('0.0.1')
    .addServer('/', 'Same origin as these docs')
    .addServer('http://localhost:3000', 'Local development')
    .build();

  return SwaggerModule.createDocument(app, config, { operationIdFactory: (_controllerKey, methodKey) => methodKey });
}
