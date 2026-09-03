import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared by main.ts and the e2e specs so tests exercise the same pipeline production does.
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001', credentials: true });
}
