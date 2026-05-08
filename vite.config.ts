import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const repositoryBase = process.env.VITE_BASE_PATH ?? '/mastering-studio-wasm/';

export default defineConfig({
  base: repositoryBase,
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@ffmpeg')) {
            return 'ffmpeg';
          }

          if (id.includes('node_modules')) {
            return 'vendor';
          }

          return undefined;
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'docs/**', 'tests/e2e/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/workers/**/*.ts']
    }
  }
});
