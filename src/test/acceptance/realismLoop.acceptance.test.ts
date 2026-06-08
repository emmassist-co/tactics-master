import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { simulateMatchAsync } from "../../domain/match/simulateMatch";
import { createMatchTrace } from "../../domain/match-v2/trace";
import { createRealismReport } from "../../domain/realism/report";
import { TACTICAL_PRESETS } from "../../domain/balance/presets";
import { keywordPlanProvider } from "../../domain/tactics/providers/keywordPlanProvider";

describe("realism loop acceptance", () => {
  it("produces a scored readiness report from a live match trace", async () => {
    const result = await simulateMatchAsync({
      openingPlans: {
        home: TACTICAL_PRESETS.combinationPlay,
        away: keywordPlanProvider("away", "Press bad touches and spring counters"),
      },
      halftimePlans: {
        home: keywordPlanProvider("home", "Keep width and slip the runner inside"),
        away: TACTICAL_PRESETS.directCounter,
      },
    });
    const trace = createMatchTrace(result);
    const report = createRealismReport(trace);

    if (process.env.REALISM_REPORT_PATH) {
      await mkdir(dirname(process.env.REALISM_REPORT_PATH), { recursive: true });
      await writeFile(process.env.REALISM_REPORT_PATH, JSON.stringify(report, null, 2));
    }

    expect(report.traceScore.categories.offBallShape.score).toBeGreaterThan(0);
    expect(report.traceScore.categories.ballInteractions.score).toBeGreaterThan(0);
    expect(report.traceScore.categories.defending.score).toBeGreaterThan(0);
    expect(report.traceScore.categories.chanceCreation.score).toBeGreaterThan(0);
    expect(typeof report.ready).toBe("boolean");
  });
});

