import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.delete("/api/items");
});

test("case-browser adds an item with accessible interaction", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Name").fill("Browser item");
  await page.getByRole("button", { name: "Add item" }).click();

  await expect(page.getByRole("status")).toHaveText("Item added");
  await expect(page.getByRole("list", { name: "Items" })).toContainText("Browser item");
});
