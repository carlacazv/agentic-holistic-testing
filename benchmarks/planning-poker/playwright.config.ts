import { defineConfig, devices } from '@playwright/test';
import { appConfig } from './config/app';

const SECOND_IN_MILLISECONDS = 1_000;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 60 * SECOND_IN_MILLISECONDS,
    expect: {
        timeout: 10 * SECOND_IN_MILLISECONDS,
    },
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results/playwright-report.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],
    use: {
        baseURL: appConfig.appUrl,
        ...appConfig.browserContext,
        actionTimeout: 10 * SECOND_IN_MILLISECONDS,
        navigationTimeout: 30 * SECOND_IN_MILLISECONDS,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command:
            'npx prisma migrate deploy --schema server/prisma/schema.prisma && npm run build && node server/src/index.js',
        env: appConfig.serverEnvironment,
        url: appConfig.healthUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * SECOND_IN_MILLISECONDS,
    },
});
