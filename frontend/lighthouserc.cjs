module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      // Only start server automatically if not already started manually (i.e., not in CI with LIGHTHOUSE_SERVER_STARTED=true)
      ...(!(process.env.CI && process.env.LIGHTHOUSE_SERVER_STARTED === 'true')
        ? {
            startServerCommand: 'bun run preview:web',
            startServerReadyPattern: '(Local:|localhost:3000)',
            startServerReadyTimeout: 60000,
          }
        : {}),
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 3200 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
};
