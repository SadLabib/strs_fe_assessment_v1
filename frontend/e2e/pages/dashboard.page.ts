import type { Page } from "@playwright/test";

export class DashboardPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
    await this.page
      .getByRole("heading", { level: 1, name: "Training dashboard" })
      .waitFor();
  }

  /** A KPI tile, e.g. "Completed". */
  kpi(label: string) {
    return this.page
      .getByRole("region", { name: "Training progress" })
      .locator('[data-slot="card"]')
      .filter({ hasText: label });
  }

  /** The card for one training property. */
  card(street: string) {
    return this.page.getByRole("listitem").filter({ hasText: street });
  }
}
