import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.delete("/api/items");
});

test("case-api creates and reads an item through the HTTP boundary", async ({ request }) => {
  const created = await request.post("/api/items", { data: { name: "API item" } });
  expect(created.status()).toBe(201);
  await expect(created).toBeOK();

  const listed = await request.get("/api/items");
  await expect(listed).toBeOK();
  expect(await listed.json()).toEqual({ items: [{ id: 1, name: "API item" }] });
});
