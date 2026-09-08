import { test as base } from "@playwright/test";
import { ItemsPage } from "../../pages/items/items.page";

export type PageObjectFixtures = {
  itemsPage: ItemsPage;
};

export const test = base.extend<PageObjectFixtures>({
  itemsPage: async ({ page }, use) => {
    await use(new ItemsPage(page));
  },
});
