import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Vitest transforms with esbuild, which does not support
    // `emitDecoratorMetadata`. Nest's DI resolves constructor parameter types
    // through that metadata, so removing this plugin breaks every
    // `Test.createTestingModule` at provider resolution.
    swc.vite({ jsc: { transform: { decoratorMetadata: true } } })
  ],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**']
    }
  }
});
