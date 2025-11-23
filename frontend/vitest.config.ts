/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
const dirname =
  typeof __dirname === 'undefined'
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@/components': path.resolve(dirname, './src/components'),
      '@/utils': path.resolve(dirname, './src/utils'),
      '@/types': path.resolve(dirname, './src/types'),
      '@/api': path.resolve(dirname, './src/api'),
      '@/hooks': path.resolve(dirname, './src/hooks'),
      '@/features': path.resolve(dirname, './src/features'),
      '@/styles': path.resolve(dirname, './src/styles'),
      '@/constants': path.resolve(dirname, './src/constants'),
      '@/providers': path.resolve(dirname, './src/providers'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    // Enhanced test configuration
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Browser tests disabled to avoid CI conflicts
    // browser: process.env.CI !== 'true' ? {
    //   enabled: true,
    //   headless: true,
    //   provider: 'playwright',
    // } : undefined,
    // Parallel test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // Enhanced coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/**/*.config.*',
        'src/**/*.setup.*',
        'src/**/*.stories.*',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'dist/',
        'coverage/',
        '**/*.config.js',
        '**/*.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.js',
        'postcss.config.cjs',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Per-file thresholds for critical components
        'src/components/ui/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/api/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Enhanced reporting
    // Disable HTML reporter in CI to prevent process from hanging
    reporters:
      process.env.CI === 'true' ? ['verbose', 'json'] : ['verbose', 'html', 'json'],
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json',
    },
    // Browser tests disabled in CI to avoid conflicts
  },
});
