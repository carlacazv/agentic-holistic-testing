import { AppRoutes } from '../enums/planning-poker/app';

type RequiredEnvironmentVariable =
    | 'ALLOWED_ORIGINS'
    | 'APP_URL'
    | 'DATABASE_URL'
    | 'HOST'
    | 'PORT';

function requiredEnvironmentVariable(
    name: RequiredEnvironmentVariable,
): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

const appUrl = requiredEnvironmentVariable('APP_URL');

/** Environment-dependent values for the benchmark and its web server. */
export const appConfig = Object.freeze({
    appUrl,
    browserContext: {
        locale: 'pt-BR',
        timezoneId: 'UTC',
    },
    healthUrl: new URL(AppRoutes.HEALTH, appUrl).toString(),
    serverEnvironment: {
        ALLOWED_ORIGINS: requiredEnvironmentVariable('ALLOWED_ORIGINS'),
        CHECKPOINT_DISABLE: process.env.CHECKPOINT_DISABLE ?? '1',
        DATABASE_URL: requiredEnvironmentVariable('DATABASE_URL'),
        HOST: requiredEnvironmentVariable('HOST'),
        PORT: requiredEnvironmentVariable('PORT'),
    },
});
