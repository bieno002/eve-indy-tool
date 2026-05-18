import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: [
            'src/**/*.test.{ts,tsx}',
            'electron/**/*.test.ts',
            'scripts/**/*.test.ts',
            'shared/**/*.test.ts',
          ],
          environment: 'jsdom',
          setupFiles: ['src/test-setup.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
