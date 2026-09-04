import { NestFactory } from '@nestjs/core';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { AppModule } from '../app.module.js';
import { buildOpenApiDocument } from './openapi.config.js';

const SPEC_PATH = join(process.cwd(), 'openapi.yaml');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const spec = stringify(buildOpenApiDocument(app));
  await app.close();

  if (!process.argv.includes('--check')) {
    await writeFile(SPEC_PATH, spec, 'utf8');
    console.log(`Wrote ${SPEC_PATH}`);
    return;
  }

  const committed = await readFile(SPEC_PATH, 'utf8').catch(() => null);
  if (committed === spec) {
    console.log('openapi.yaml is up to date');
    return;
  }

  console.error(committed === null ? 'openapi.yaml is missing.' : 'openapi.yaml is out of date.');
  console.error('Run `pnpm openapi:generate` and commit the result.');
  process.exitCode = 1;
}

void main();
