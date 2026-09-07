import { PrismaClient } from '@prisma/client';
import {
    test as base,
    type BrowserContext,
    type Page,
} from '@playwright/test';
import { appConfig } from '../../config/app';
import { HomePage } from '../../pages/planning-poker/home.page';
import { RoomPage } from '../../pages/planning-poker/room.page';

type ParticipantSession = {
    homePage: HomePage;
    roomPage: RoomPage;
};

export type RoomCleanup = {
    trackCreatorName: (creatorName: string) => void;
};

export type TeamSession = {
    host: ParticipantSession;
    participant: ParticipantSession;
    trackCreatorName: (creatorName: string) => void;
};

export type HelperFixtures = {
    roomCleanup: RoomCleanup;
    teamSession: TeamSession;
};

async function closeContexts(contexts: BrowserContext[]): Promise<void> {
    const failures: unknown[] = [];

    for (const context of contexts) {
        try {
            await context.close();
        } catch (error: unknown) {
            failures.push(error);
        }
    }

    if (failures.length > 0) {
        throw new AggregateError(failures, 'Failed to close browser contexts');
    }
}

function participantSession(page: Page): ParticipantSession {
    return {
        homePage: new HomePage(page),
        roomPage: new RoomPage(page),
    };
}

/** Lifecycle fixtures for isolated browser sessions and database cleanup. */
export const test = base.extend<HelperFixtures>({
    roomCleanup: async ({}, use) => {
        const creatorNames = new Set<string>();

        await use({
            trackCreatorName: (creatorName: string): void => {
                creatorNames.add(creatorName);
            },
        });

        if (creatorNames.size === 0) {
            return;
        }

        const database = new PrismaClient();

        try {
            await database.room.deleteMany({
                where: { creatorName: { in: [...creatorNames] } },
            });
        } finally {
            await database.$disconnect();
        }
    },
    teamSession: async ({ browser, roomCleanup }, use) => {
        const contextOptions = {
            ...appConfig.browserContext,
            baseURL: appConfig.appUrl,
        };
        const hostContext = await browser.newContext(contextOptions);
        const participantContext = await browser.newContext(contextOptions);
        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        try {
            await use({
                host: participantSession(hostPage),
                participant: participantSession(participantPage),
                trackCreatorName: roomCleanup.trackCreatorName,
            });
        } finally {
            await closeContexts([participantContext, hostContext]);
        }
    },
});
