import type { Locator, Page } from "@playwright/test";

export class ItemsPage {
  readonly nameField: Locator;
  readonly addButton: Locator;
  readonly status: Locator;
  readonly list: Locator;

  constructor(private readonly page: Page) {
    this.nameField = page.getByLabel("Name");
    this.addButton = page.getByRole("button", { name: "Add item" });
    this.status = page.getByRole("status");
    this.list = page.getByRole("list", { name: "Items" });
  }

  async open(): Promise<void> {
    await this.page.goto("/");
  }

  async addItem(name: string): Promise<void> {
    await this.nameField.fill(name);
    await this.addButton.click();
  }
}
