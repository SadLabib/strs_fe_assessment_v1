import type { Page, Route } from "@playwright/test";

import { PROPERTIES } from "./fixtures/properties";
import { expect, test } from "./fixtures/test";
import { resetData } from "./support/backend";

/**
 * Makes every Server Action call fail while page loads keep working. Actions
 * are POSTs carrying a `next-action` header, so only they are intercepted.
 * Returns a function that restores the network.
 */
async function breakServerActions(
  page: Page,
  failure: "network" | "server-error",
) {
  const handler = (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST" || !request.headers()["next-action"]) {
      return route.fallback();
    }
    return failure === "network"
      ? route.abort("internetdisconnected")
      : route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "Internal Server Error",
        });
  };
  await page.route("**/*", handler);
  return () => page.unroute("**/*", handler);
}

const PURCHASE = { down: "20", rate: "7", term: "30", closing: "3" };

test.describe("resilience", () => {
  test.beforeAll(() => resetData());

  test("a saved draft survives a reload and shows as Resume on the dashboard", async ({
    page,
    api,
    workspace,
    dashboard,
  }) => {
    const property = PROPERTIES.kissimmee;
    const id = await api.createDraft(property);
    await workspace.goto(id);
    await workspace.fillPurchase({
      price: String(property.price),
      ...PURCHASE,
    });
    await workspace.waitForSaved();

    await page.reload();
    await expect(workspace.field("Interest rate")).toHaveValue("7");
    await expect(workspace.field("Loan term")).toHaveValue("30");

    await dashboard.goto();
    await expect(
      dashboard
        .card(property.street)
        .getByRole("link", { name: "Resume draft" }),
    ).toHaveAttribute("href", `/underwritings/${id}`);
  });

  test("a failed save says so, and Retry saves once the connection is back", async ({
    page,
    api,
    workspace,
  }) => {
    const property = PROPERTIES.blueRidge;
    const id = await api.createDraft(property);
    await workspace.goto(id);

    const restore = await breakServerActions(page, "network");
    await workspace.fillPurchase({
      price: String(property.price),
      ...PURCHASE,
    });
    await expect(
      page.getByRole("status").filter({ hasText: "Couldn't reach the server" }),
    ).toBeVisible();
    const retry = page.getByRole("button", { name: "Retry" });
    await expect(retry).toBeVisible();

    await restore();
    await retry.click();
    await workspace.waitForSaved();

    await page.reload();
    await expect(workspace.field("Interest rate")).toHaveValue("7");
  });

  test("a failed submit keeps the trainee on their draft, and submitting again works", async ({
    page,
    api,
    workspace,
    results,
  }) => {
    const property = PROPERTIES.sevierville;
    const id = await api.completeDraft(property, 82_000);
    await workspace.goto(id);
    await workspace.openReview();

    const restore = await breakServerActions(page, "server-error");
    await workspace.submit();
    await expect(
      page.getByRole("alert").filter({ hasText: "Couldn't reach the server" }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/underwritings/${id}$`));
    await expect(
      page.getByRole("button", { name: "Submit for grading" }),
    ).toBeEnabled();

    await restore();
    await workspace.submit();
    await results.waitForLoad();
    await expect(results.scoreCard).toContainText("$82,000");
  });

  test("double-clicking Start opens one draft, not two", async ({
    page,
    api,
  }) => {
    const property = PROPERTIES.portAransas;
    await page.goto(`/properties/${property.zpid}`);

    await page.getByRole("button", { name: "Start underwriting" }).dblclick();
    await page.waitForURL(/\/underwritings\/\d+$/);
    const id = Number(page.url().split("/").pop());

    // Ids are sequential: a second draft would have taken the next one.
    expect(await api.underwritingExists(id + 1)).toBe(false);
    expect((await api.dashboardRow(property)).active_underwriting_id).toBe(id);
  });

  test("unknown ids show the not-found page", async ({ page }) => {
    for (const path of [
      "/underwritings/999999",
      "/submissions/999999",
      "/properties/123",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: "Page not found" }),
      ).toBeVisible();
    }
  });

  test("the analyst's reference underwriting is never served", async ({
    page,
    api,
    workspace,
  }) => {
    const referenceId = await api.referenceId(PROPERTIES.gatlinburg);
    await page.goto(`/underwritings/${referenceId}`);

    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(workspace.field("Purchase price")).toHaveCount(0);
  });
});
