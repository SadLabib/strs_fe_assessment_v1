import type { Submission } from "@/lib/api/schemas";

export type LeaderboardEntry = {
  submission: Submission;
  rank: number;
  /** 1 for the first attempt on the property, 2 for the second, … */
  attempt: number;
  isCurrent: boolean;
};

const byTime = (a: Submission, b: Submission) =>
  Date.parse(a.submitted_at) - Date.parse(b.submitted_at) || a.id - b.id;

/**
 * Graded attempts on one property, closest to the analyst first; on a tie the
 * earlier attempt ranks higher. The API has no leaderboard or trainee
 * identity, so this ranks attempts rather than people.
 */
export function rankAttempts(submissions: Submission[], currentId: number) {
  const attemptNumber = new Map(
    [...submissions]
      .sort(byTime)
      .map((submission, index) => [submission.id, index + 1]),
  );

  const entries: LeaderboardEntry[] = [...submissions]
    .sort(
      (a, b) => a.breakdown.deviation - b.breakdown.deviation || byTime(a, b),
    )
    .map((submission, index) => ({
      submission,
      rank: index + 1,
      attempt: attemptNumber.get(submission.id) ?? index + 1,
      isCurrent: submission.id === currentId,
    }));

  return {
    entries,
    current: entries.find((entry) => entry.isCurrent) ?? null,
  };
}
