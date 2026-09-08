import { expect, test } from "../../../fixtures/pom/test-options";
import { ItemRoute } from "../../../enums/items/app";
import { generateItemName } from "../../../test-data/factories/items/item.factory";

test.describe("Given an empty item collection", () => {
  test.beforeEach(async ({ resetItems }) => resetItems());
  test.afterEach(async ({ resetItems }) => resetItems());

  test.describe("When creating an item through the HTTP boundary", () => {
    test(
      "creates and reads an item",
      {
        tag: "@api",
        annotation: { type: "test_case", description: "case-api" },
      },
      async ({ request }, testInfo) => {
        const name = generateItemName(testInfo, "api-item");
        const created = await request.post(ItemRoute.API, { data: { name } });

        await test.step("Should accept the creation as 201", async () => {
          await expect(created).toBeOK();
          expect(created.status()).toBe(201);
        });

        await test.step("Should return the created item on read", async () => {
          const listed = await request.get(ItemRoute.API);
          await expect(listed).toBeOK();
          expect(await listed.json()).toEqual({ items: [{ id: 1, name }] });
        });
      },
    );
  });
});
