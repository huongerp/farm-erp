import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    // Node-first: dựng jsdom cho mọi test là lãng phí vì phần lớn test ở đây là
    // logic thuần (schema, KPI, khấu hao...). File nào cần DOM thì tự bật bằng
    // docblock `// @vitest-environment jsdom` ở đầu file, hoặc đặt tên .tsx.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/*.{test,spec}.ts'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['**/*.{test,spec}.tsx'],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
