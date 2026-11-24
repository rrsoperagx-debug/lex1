import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/ai_benchmark/**/*.test.ts'],
    globals: true,
    testTimeout: 120_000,
    // Pass env vars to tests
    env: {
      BASE_URL: process.env.BASE_URL || 'http://localhost:8000',
    },
  },
});

