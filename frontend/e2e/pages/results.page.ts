import { expect, type Page } from "@playwright/test";

import { bandRanges, SCORE, type ScoringCase } from "../fixtures/cases";
import { BAND_LABEL, expectedExplanation, usd } from "../support/expected";

/** The evaluation results page: score, explanation and leaderboard. */
export class ResultsPage {
  constructor(readonly page: Page) {}

  async waitForLoad() {
    await this.page.waitForURL(/\/submissions\/\d+$/, { timeout: 20_000 });
    await this.scoreCard.waitFor();
  }

  private card(heading: string) {
    return this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.getByRole("heading", { name: heading }) });
  }

  get scoreCard() {
    return this.card("Your score");
  }

  get leaderboard() {
    return this.card("Leaderboard");
  }

  get nextSteps() {
    return this.card("What next?");
  }

  /** The explanation, score, band and target ranges for a case. */
  async expectGrade({ property, mid, band }: ScoringCase) {
    const card = this.scoreCard;
    // The sentence first: when the band is wrong, the failure prints the
    // whole explanation the page gave instead.
    await expect(card.getByText(/^Your Mid forecast of/)).toHaveText(
      expectedExplanation(mid, property.referenceMid, band),
    );
    await expect(
      card.getByText(String(SCORE[band]), { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText(BAND_LABEL[band], { exact: true }),
    ).toBeVisible();

    const ranges = bandRanges(property);
    await expect(card).toContainText(
      `${usd(ranges.best[0])} – ${usd(ranges.best[1])}`,
    );
    await expect(card).toContainText(
      `${usd(ranges.medium[0])} – ${usd(ranges.medium[1])}`,
    );
  }
}
