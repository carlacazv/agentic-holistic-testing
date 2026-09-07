import { test as base } from '@playwright/test';
import { HomePage } from '../../pages/planning-poker/home.page';
import { RoomPage } from '../../pages/planning-poker/room.page';

export type PageObjectFixtures = {
    homePage: HomePage;
    roomPage: RoomPage;
};

/** Playwright fixture layer that owns all default-context page objects. */
export const test = base.extend<PageObjectFixtures>({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },
    roomPage: async ({ page }, use) => {
        await use(new RoomPage(page));
    },
});
