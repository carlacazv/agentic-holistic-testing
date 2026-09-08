import { expect, test } from "../../../fixtures/pom/test-options";
import { ItemText } from "../../../enums/items/app";
import { generateItemName } from "../../../test-data/factories/items/item.factory";

test.describe("Given an empty item list", () => {
  test.beforeEach(async ({ itemsPage, resetItems }) => {
    await resetItems();
    await itemsPage.open();
  });
  test.afterEach(async ({ resetItems }) => resetItems());

  test.describe("When adding an item with accessible interaction", () => {
    test(
      "adds the item to the list",
      {
        tag: "@e2e",
        annotation: { type: "test_case", description: "case-browser" },
      },
      async ({ itemsPage }, testInfo) => {
        const name = generateItemName(testInfo, "browser-item");
        await itemsPage.addItem(name);

        await test.step("Should announce that the item was added", async () => {
          await expect(itemsPage.status).toHaveText(ItemText.ADDED_STATUS);
        });

        await test.step("Should show the item in the list", async () => {
          await expect(itemsPage.list).toContainText(name);
        });
      },
    );
  });
});
