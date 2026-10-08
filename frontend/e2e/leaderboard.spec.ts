import { PROPERTIES } from "./fixtures/properties";
import { expect, test } from "./fixtures/test";
import { resetData } from "./support/backend";

// Gatlinburg's analyst Mid is $125,000.
const property = PROPERTIES.gatlinburg;

test.beforeAll(() => resetData());

test("attempts rank by distance from the analyst, earlier first on a tie", async ({
  page,
  api,
  workspace,
  results,
}) => {
  // Earlier attempts, arranged through the API (oldest first).
  await api.submit(property, 150_000); // attempt 1: 20% above
  await api.submit(property, 130_000); // attempt 2: 4% above
  await api.submit(property, 200_000); // attempt 3: 60% above

  // Attempt 4 through the UI: 4% below, the same distance as attempt 2.
  await workspace.goto(await api.completeDraft(property, 120_000));
  await workspace.openReview();
  await workspace.submit();
  await results.waitForLoad();

  const board = results.leaderboard;
  await expect(board).toContainText("#2 of 4 attempts");

  const rows = board.getByRole("listitem");
  await expect(rows).toHaveText([
    /Attempt 2.*4\.0% above/,
    /Attempt 4.*This attempt.*4\.0% below/,
    /Attempt 1.*20\.0% above/,
    /Attempt 3.*60\.0% above/,
  ]);
  await expect(rows.nth(1)).toHaveAttribute("aria-current", "true");

  // Other attempts link to their own results, where they're the current one.
  await rows.nth(0).getByRole("link", { name: "Attempt 2" }).click();
  await expect(page).toHaveURL(/\/submissions\/\d+$/);
  await expect(results.leaderboard).toContainText("#1 of 4 attempts");
  await expect(
    results.leaderboard.locator('[aria-current="true"]'),
  ).toContainText("Attempt 2");
});
