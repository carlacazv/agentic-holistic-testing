import { expect, test } from "@playwright/test";
import { ItemsPage } from "./pages/items.page";

test.describe("Given an empty item list", () => {
  let items: ItemsPage;

  test.beforeEach(async ({ page, request }) => {
    await request.delete("/api/items");
    items = new ItemsPage(page);
    await items.open();
  });

  test.describe("When adding an item with accessible interaction", () => {
    test("case-browser adds the item to the list", async () => {
      await items.addItem("Browser item");

      await test.step("Should announce that the item was added", async () => {
        await expect(items.status).toHaveText("Item added");
      });

      await test.step("Should show the item in the list", async () => {
        await expect(items.list).toContainText("Browser item");
      });
    });
  });
});
