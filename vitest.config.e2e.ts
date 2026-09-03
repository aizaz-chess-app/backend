import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // See vitest.config.ts — required for Nest decorator metadata.
    swc.vite({ jsc: { transform: { decoratorMetadata: true } } })
  ],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    include: ['test/**/*.e2e-spec.ts']
  }
});
