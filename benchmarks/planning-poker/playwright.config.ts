import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-report.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'CHECKPOINT_DISABLE=1 DATABASE_URL=file:./e2e.db npx prisma migrate deploy --schema server/prisma/schema.prisma && npm run build && PORT=3100 HOST=127.0.0.1 ALLOWED_ORIGINS=http://127.0.0.1:3100 DATABASE_URL=file:./e2e.db node server/src/index.js',
    url: 'http://127.0.0.1:3100/api/health',
    timeout: 120_000,
  },
})
