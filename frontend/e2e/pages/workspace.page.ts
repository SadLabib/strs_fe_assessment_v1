import { expect, type Page } from "@playwright/test";

/** The underwriting workspace: Financials, Analysis, Deal tags and Review. */
export class WorkspacePage {
  constructor(readonly page: Page) {}

  async goto(underwritingId: number) {
    await this.page.goto(`/underwritings/${underwritingId}`);
    await this.field("Purchase price").waitFor();
  }

  /** Inputs by their visible label; exact, because "Low" is also inside "cash flow". */
  field(label: string | RegExp) {
    return typeof label === "string"
      ? this.page.getByLabel(label, { exact: true })
      : this.page.getByLabel(label);
  }

  tab(name: string | RegExp) {
    return this.page.getByRole("tab", { name });
  }

  get rail() {
    return this.page.getByRole("complementary", { name: "Deal summary" });
  }

  async waitForSaved() {
    await expect(this.page.getByText(/^Saved /)).toBeVisible({
      timeout: 15_000,
    });
  }

  /** Quick-add a line item ("Furniture", "Utilities", …) and type its amount. */
  async quickAdd(item: string, amount: string) {
    await this.page.getByRole("button", { name: item, exact: true }).click();
    await this.page.keyboard.type(amount);
  }

  async fillPurchase(values: {
    price: string;
    down: string;
    rate: string;
    term: string;
    closing: string;
  }) {
    await this.field("Purchase price").fill(values.price);
    await this.field("Down payment").fill(values.down);
    await this.field("Interest rate").fill(values.rate);
    await this.field("Loan term").fill(values.term);
    await this.field("Closing costs").fill(values.closing);
  }

  async fillRevenue(values: {
    low: string;
    mid: string;
    high: string;
    appreciation: string;
  }) {
    await this.tab(/^Analysis/).click();
    await this.field("Low").fill(values.low);
    await this.field(/^Mid/).fill(values.mid);
    await this.field("High").fill(values.high);
    await this.field("Annual appreciation").fill(values.appreciation);
    await this.field("Annual appreciation").blur();
  }

  /** Opens Review, which saves and waits for the server's own numbers. */
  async openReview() {
    await this.tab(/^Review/).click();
    await expect(
      this.page.getByText(/^Calculated by the training API/),
    ).toBeVisible({
      timeout: 15_000,
    });
  }

  async submit() {
    await this.page.getByRole("button", { name: "Submit for grading" }).click();
    await this.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Submit for grading" })
      .click();
  }
}
