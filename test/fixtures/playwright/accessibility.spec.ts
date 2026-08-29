import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Given the items page in its default state", () => {
  test.describe("When running the automated WCAG 2.2 AA scan", () => {
    test("fixture has no automatically detectable violations", async ({ page }) => {
      await page.goto("/");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      await test.step("Should report no WCAG 2.2 AA violations", async () => {
        expect(results.violations).toEqual([]);
      });
    });
  });
});
