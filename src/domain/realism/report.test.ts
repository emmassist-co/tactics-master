import { describe, expect, it } from "vitest";
import { createRealismReport, formatRealismReport } from "./report";
import type { MatchTrace } from "./types";

const trace: MatchTrace = {
  totalFrames: 4,
  finalScore: { home: 1, away: 0 },
  events: [
    {
      tick: 0,
      half: 1,
      event: "Pass",
      eventType: "pass",
      possession: "home",
      ballStateType: "in-transit",
      pressureCount: 1,
      ball: { x: 5, y: 4 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 2.8, away: 2.7 },
    },
    {
      tick: 1,
      half: 1,
      event: "Carry",
      eventType: "carry",
      possession: "home",
      carrierId: "home-forward",
      ballStateType: "controlled",
      pressureCount: 1,
      ball: { x: 8, y: 4 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 3, away: 2.8 },
    },
    {
      tick: 2,
      half: 1,
      event: "Save",
      eventType: "save",
      possession: "home",
      ballStateType: "loose",
      pressureCount: 2,
      ball: { x: 9, y: 4 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 2.9, away: 2.6 },
    },
    {
      tick: 3,
      half: 1,
      event: "Goal",
      eventType: "goal",
      possession: "away",
      ballStateType: "controlled",
      pressureCount: 0,
      ball: { x: 6, y: 4 },
      score: { home: 1, away: 0 },
      averageTeamSpacing: { home: 2.8, away: 2.8 },
    },
  ],
};

describe("createRealismReport", () => {
  it("builds a readiness report with optional browser evidence", () => {
    const report = createRealismReport(trace, {
      started: true,
      reachedLiveField: true,
      reachedHalftime: true,
      reachedResult: true,
      screenshots: ["live.png", "result.png"],
      notes: [],
    });

    expect(report.overall).toBeGreaterThan(0);
    expect(report.browserReview?.score).toBeGreaterThan(0);
    expect(formatRealismReport(report)).toContain("Overall:");
  });
});

