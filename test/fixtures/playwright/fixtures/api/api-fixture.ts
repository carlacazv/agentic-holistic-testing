import { test as base } from "@playwright/test";
import { ItemRoute } from "../../enums/items/app";

export type ApiFixtures = {
  resetItems: () => Promise<void>;
};

export const test = base.extend<ApiFixtures>({
  resetItems: async ({ request }, use) => {
    await use(async () => {
      const response = await request.delete(ItemRoute.API);
      if (!response.ok()) throw new Error(`Item cleanup failed: ${response.status()}`);
    });
  },
});
