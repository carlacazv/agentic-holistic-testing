import { expect, test } from "@playwright/test";

test.describe("Given an empty item collection", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/items");
  });

  test.describe("When creating an item through the HTTP boundary", () => {
    test("case-api creates and reads an item", async ({ request }) => {
      const created = await request.post("/api/items", { data: { name: "API item" } });

      await test.step("Should accept the creation as 201", async () => {
        await expect(created).toBeOK();
        expect(created.status()).toBe(201);
      });

      await test.step("Should return the created item on read", async () => {
        const listed = await request.get("/api/items");
        await expect(listed).toBeOK();
        expect(await listed.json()).toEqual({ items: [{ id: 1, name: "API item" }] });
      });
    });
  });
});
