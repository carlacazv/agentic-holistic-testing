import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../../../fixtures/pom/test-options";

test.describe("Given the items page in its default state", () => {
  test.describe("When running the automated WCAG 2.2 AA scan", () => {
    test(
      "has no automatically detectable violations",
      {
        tag: "@regression",
        annotation: { type: "test_case", description: "case-accessibility" },
      },
      async ({ itemsPage, page, resetItems }) => {
        await resetItems();
        await itemsPage.open();
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();

        await test.step("Should report no WCAG 2.2 AA violations", async () => {
          expect(results.violations).toEqual([]);
        });
      },
    );
  });
});
