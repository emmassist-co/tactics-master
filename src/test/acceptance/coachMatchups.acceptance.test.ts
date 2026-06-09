import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { COACH_MATCHUPS, COACH_PROFILES, runCoachMatchupSuite } from "../../domain/balance/coachMatchups";

describe("coach matchup suite", () => {
  it("runs multiple inspired tactical matchups and produces stable realism summaries", async () => {
    const suite = await runCoachMatchupSuite();

    if (process.env.COACH_MATCHUPS_REPORT_PATH) {
      const payload = {
        averageOverall: suite.averageOverall,
        readyCount: suite.readyCount,
        categoryAverages: suite.categoryAverages,
        results: suite.results.map((result) => ({
          matchupId: result.matchup.id,
          note: result.matchup.note,
          homeCoach: result.homeCoach.inspiration,
          awayCoach: result.awayCoach.inspiration,
          winner: result.winner,
          finalScore: result.finalScore,
          overall: result.report.overall,
          ready: result.report.ready,
          failedCategories: result.report.traceScore.failedCategories,
          categoryScores: Object.fromEntries(
            Object.entries(result.report.traceScore.categories).map(([key, value]) => [key, value.score]),
          ),
          shotLikeEvents: result.shotLikeEvents,
          shotsOnGoalEvents: result.shotsOnGoalEvents,
          pressureFrames: result.pressureFrames,
          turnoverEvents: result.turnoverEvents,
          uniqueCarriers: result.uniqueCarriers,
        })),
      };

      await mkdir(dirname(process.env.COACH_MATCHUPS_REPORT_PATH), { recursive: true });
      await writeFile(process.env.COACH_MATCHUPS_REPORT_PATH, JSON.stringify(payload, null, 2));
    }

    expect(Object.keys(COACH_PROFILES).length).toBeGreaterThanOrEqual(5);
    expect(COACH_MATCHUPS.length).toBeGreaterThanOrEqual(5);
    expect(suite.results).toHaveLength(COACH_MATCHUPS.length);
    expect(suite.averageOverall).toBeGreaterThanOrEqual(3);
    expect(suite.categoryAverages.offBallShape).toBeGreaterThanOrEqual(2);
    expect(suite.categoryAverages.ballInteractions).toBeGreaterThanOrEqual(3);
    expect(suite.categoryAverages.defending).toBeGreaterThanOrEqual(3);
    expect(suite.categoryAverages.chanceCreation).toBeGreaterThanOrEqual(3.5);

    const lowestOverall = Math.min(...suite.results.map((result) => result.report.overall));
    expect(lowestOverall).toBeGreaterThanOrEqual(2.5);
    expect(Math.max(...suite.results.map((result) => result.report.overall))).toBeGreaterThanOrEqual(4);
    expect(suite.results.every((result) => result.shotLikeEvents > 0)).toBe(true);
    expect(suite.results.every((result) => result.pressureFrames > 0)).toBe(true);
    expect(suite.results.every((result) => result.turnoverEvents > 0)).toBe(true);
    expect(suite.results.every((result) => result.uniqueCarriers >= 3)).toBe(true);

    const scorelines = suite.results.map((result) => `${result.finalScore.home}-${result.finalScore.away}`);
    expect(new Set(scorelines).size).toBeGreaterThanOrEqual(2);

    const goalMargins = suite.results.map((result) => Math.abs(result.finalScore.home - result.finalScore.away));
    expect(goalMargins.some((margin) => margin === 1)).toBe(true);
    expect(goalMargins.some((margin) => margin >= 2)).toBe(true);
  });
});
