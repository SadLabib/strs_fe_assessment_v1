import { describe, expect, it } from "vitest";

import type { Submission } from "@/lib/api/schemas";

import { rankAttempts } from "./leaderboard";
import { scoreBands } from "./score";

function attempt(
  id: number,
  deviation: number,
  submittedAt: string,
): Submission {
  return {
    id,
    underwriting_id: id + 100,
    zpid: "41234567",
    rating: deviation <= 0.1 ? "best" : deviation <= 0.25 ? "medium" : "low",
    accuracy: deviation <= 0.1 ? 100 : deviation <= 0.25 ? 70 : 40,
    breakdown: {
      label: "Mid revenue forecast",
      candidate: 125_000 * (1 + deviation),
      reference: 125_000,
      deviation,
      best_threshold: 0.1,
      medium_threshold: 0.25,
    },
    submitted_at: submittedAt,
  };
}

describe("rankAttempts", () => {
  const first = attempt(1, 0.2, "2026-10-08T10:00:00Z");
  const second = attempt(2, 0.04, "2026-10-08T11:00:00Z");
  const third = attempt(3, 0.6, "2026-10-08T12:00:00Z");

  it("ranks the closest forecast first and numbers attempts by time", () => {
    const { entries, current } = rankAttempts([third, second, first], 1);

    expect(entries.map((e) => [e.submission.id, e.rank, e.attempt])).toEqual([
      [2, 1, 2],
      [1, 2, 1],
      [3, 3, 3],
    ]);
    expect(current?.rank).toBe(2);
    expect(entries.filter((e) => e.isCurrent)).toHaveLength(1);
  });

  it("puts the earlier attempt first on a tie", () => {
    const tieLater = attempt(4, 0.04, "2026-10-08T13:00:00Z");
    const { entries } = rankAttempts([tieLater, second], 4);
    expect(entries.map((e) => e.submission.id)).toEqual([2, 4]);
  });

  it("handles a single attempt", () => {
    expect(rankAttempts([first], 1).current).toMatchObject({
      rank: 1,
      attempt: 1,
    });
  });
});

describe("scoreBands", () => {
  it("matches the PDF's ranges for Gatlinburg ($125,000)", () => {
    const bands = scoreBands(125_000, 0.1, 0.25);
    expect(bands.best.low).toBeCloseTo(112_500, 6);
    expect(bands.best.high).toBeCloseTo(137_500, 6);
    expect(bands.medium.low).toBeCloseTo(93_750, 6);
    expect(bands.medium.high).toBeCloseTo(156_250, 6);
  });
});
