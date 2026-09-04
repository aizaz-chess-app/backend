import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { buildOpenApiDocument } from './openapi/openapi.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  SwaggerModule.setup('api-docs', app, buildOpenApiDocument(app));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
