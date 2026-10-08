import { PROPERTIES } from "./fixtures/properties";
import { expect, test } from "./fixtures/test";
import { resetData } from "./support/backend";

const property = PROPERTIES.gatlinburg;

test.beforeAll(() => resetData());

test("a trainee underwrites a property from the dashboard to a graded result", async ({
  page,
  dashboard,
  workspace,
  results,
}) => {
  await test.step("pick a property on the dashboard", async () => {
    await dashboard.goto();
    await expect(dashboard.kpi("Completed")).toContainText("0 / 6");
    await dashboard
      .card(property.street)
      .getByRole("link", { name: "Start" })
      .click();
  });

  await test.step("read the brief and start", async () => {
    await expect(
      page.getByRole("heading", { level: 1, name: property.street }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "How this works" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start underwriting" }).click();
    await page.waitForURL(/\/underwritings\/\d+$/);
  });

  await test.step("fill in the financials", async () => {
    // Prefilled from the listing.
    await expect(workspace.field("Purchase price")).toHaveValue(/^675,?000$/);
    await workspace.fillPurchase({
      price: "675000",
      down: "20",
      rate: "7",
      term: "30",
      closing: "3",
    });
    await workspace.quickAdd("Furniture", "40000");
    await workspace.quickAdd("Utilities", "450");
    // The rail previews the cost before anything reaches the server:
    // 20% down ($135,000) + 3% closing ($20,250) + $40,000 setup.
    await expect(workspace.rail).toContainText("$195,250");
  });

  await test.step("forecast revenue on the Analysis tab", async () => {
    await workspace.fillRevenue({
      low: "110000",
      mid: "130000",
      high: "150000",
      appreciation: "3",
    });
    await expect(workspace.tab(/^Analysis/)).toBeVisible();
  });

  await test.step("tag the deal", async () => {
    await workspace.tab(/^Deal tags/).click();
    await page.getByRole("switch", { name: "Furnished" }).click();
    await expect(page.getByRole("switch", { name: "Furnished" })).toBeChecked();
  });

  await test.step("review and submit", async () => {
    await workspace.openReview();
    await expect(
      page.getByText("Everything required is filled in."),
    ).toBeVisible();
    await workspace.submit();
  });

  await test.step("see the score, why, and the leaderboard", async () => {
    await results.waitForLoad();
    await results.expectGrade({
      property,
      label: "4% above",
      mid: 130_000,
      band: "best",
    });
    await expect(results.leaderboard).toContainText("#1 of 1 attempt");
    await expect(
      results.leaderboard.locator('[aria-current="true"]'),
    ).toContainText("This attempt");
  });

  await test.step("the dashboard reflects the attempt", async () => {
    await results.nextSteps
      .getByRole("link", { name: "Back to dashboard" })
      .click();
    await expect(dashboard.kpi("Completed")).toContainText("1 / 6");
    const card = dashboard.card(property.street);
    await expect(card.getByText("Submitted")).toBeVisible();
    await expect(
      card.getByRole("link", { name: "View results" }),
    ).toBeVisible();
  });
});
