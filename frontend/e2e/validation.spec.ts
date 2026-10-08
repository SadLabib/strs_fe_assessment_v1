import { PROPERTIES } from "./fixtures/properties";
import { expect, test } from "./fixtures/test";

const property = PROPERTIES.brokenBow;

test.describe("validation", () => {
  test("a fresh draft can't be submitted and the checklist says why", async ({
    page,
    api,
    workspace,
  }) => {
    await workspace.goto(await api.createDraft(property));
    await workspace.tab(/^Review/).click();

    await expect(
      page.getByText(/items need attention before you can submit/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Interest rate is required" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mid revenue is required" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Submit for grading" }),
    ).toBeDisabled();
  });

  test("a checklist item jumps to its field", async ({
    page,
    api,
    workspace,
  }) => {
    await workspace.goto(await api.createDraft(property));
    await workspace.tab(/^Review/).click();

    await page.getByRole("button", { name: "Mid revenue is required" }).click();

    await expect(workspace.tab(/^Analysis/)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(workspace.field(/^Mid/)).toBeFocused();
    await expect(workspace.field(/^Mid/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("out-of-range values show an error on the field", async ({
    page,
    api,
    workspace,
  }) => {
    await workspace.goto(await api.createDraft(property));

    await workspace.field("Down payment").fill("120");
    await workspace.field("Down payment").blur();
    await expect(workspace.field("Down payment")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByText("Down payment can't be more than 100%"),
    ).toBeVisible();

    await workspace.field("Loan term").fill("2.5");
    await workspace.field("Loan term").blur();
    await expect(page.getByText("Loan term must be whole years")).toBeVisible();

    // Fixing the value clears the error as you type.
    await workspace.field("Down payment").fill("25");
    await expect(
      page.getByText("Down payment can't be more than 100%"),
    ).toBeHidden();
    await expect(workspace.field("Down payment")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("revenue scenarios must go Low ≤ Mid ≤ High", async ({
    page,
    workspace,
    api,
  }) => {
    await workspace.goto(await api.createDraft(property));
    await workspace.tab(/^Analysis/).click();
    await workspace.field("Annual appreciation").fill("3");
    await workspace.field("High").fill("85000");
    await workspace.field("Low").fill("100000");
    await workspace.field(/^Mid/).fill("90000");
    await workspace.field(/^Mid/).blur();

    await expect(page.getByText("Mid can't be lower than Low")).toBeVisible();
    await expect(page.getByText("High can't be lower than Mid")).toBeVisible();

    // Changing one side re-checks its neighbour.
    await workspace.field("Low").fill("80000");
    await expect(page.getByText("Mid can't be lower than Low")).toBeHidden();
  });

  test("zero cash out of pocket is caught before the API rejects it", async ({
    page,
    api,
    workspace,
  }) => {
    await workspace.goto(await api.createDraft(property));
    await workspace.fillPurchase({
      price: String(property.price),
      down: "0",
      rate: "7",
      term: "30",
      closing: "0",
    });

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Total out of pocket must be more than $0" }),
    ).toBeVisible();

    await workspace.tab(/^Review/).click();
    await expect(
      page.getByRole("button", {
        name: "Total out of pocket must be more than $0",
      }),
    ).toBeVisible();
  });

  test("fixing every item enables Submit", async ({ page, api, workspace }) => {
    await workspace.goto(await api.createDraft(property));
    await workspace.fillPurchase({
      price: String(property.price),
      down: "20",
      rate: "7",
      term: "30",
      closing: "3",
    });
    await workspace.fillRevenue({
      low: "80000",
      mid: "96000",
      high: "110000",
      appreciation: "3",
    });
    await workspace.openReview();

    await expect(
      page.getByText("Everything required is filled in."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Submit for grading" }),
    ).toBeEnabled();
  });
});
