import type { Locator, Page } from "@playwright/test";
import { ItemRoute, ItemText } from "../../enums/items/app";

export class ItemsPage {
  constructor(private readonly page: Page) {}

  get nameField(): Locator {
    return this.page.getByLabel(ItemText.NAME);
  }

  get addButton(): Locator {
    return this.page.getByRole("button", { name: ItemText.ADD_ITEM });
  }

  get status(): Locator {
    return this.page.getByRole("status");
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: ItemText.ITEMS });
  }

  async open(): Promise<void> {
    await this.page.goto(ItemRoute.HOME);
  }

  async addItem(name: string): Promise<void> {
    await this.nameField.fill(name);
    await this.addButton.click();
  }
}
