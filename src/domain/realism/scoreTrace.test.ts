import { describe, expect, it } from "vitest";
import { scoreTrace } from "./scoreTrace";
import type { MatchTrace } from "./types";

const weakTrace: MatchTrace = {
  totalFrames: 6,
  finalScore: { home: 0, away: 0 },
  events: Array.from({ length: 6 }, (_, tick) => ({
    tick,
    half: 1,
    event: "Midfield scramble",
    eventType: "build-up",
    possession: "home",
    carrierId: "home-link",
    ballStateType: "controlled",
    pressureCount: 0,
    ball: { x: 6, y: 4 },
    score: { home: 0, away: 0 },
    averageTeamSpacing: { home: 1.6, away: 1.7 },
  })),
};

const strongerTrace: MatchTrace = {
  totalFrames: 8,
  finalScore: { home: 1, away: 0 },
  events: [
    {
      tick: 0,
      half: 1,
      event: "Kick-off",
      eventType: "build-up",
      possession: "home",
      carrierId: "home-link",
      ballStateType: "controlled",
      pressureCount: 1,
      ball: { x: 4, y: 4 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 2.8, away: 2.9 },
    },
    {
      tick: 1,
      half: 1,
      event: "Pass wide",
      eventType: "pass",
      possession: "home",
      ballStateType: "in-transit",
      pressureCount: 1,
      ball: { x: 5.5, y: 3.4 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 2.9, away: 2.7 },
    },
    {
      tick: 2,
      half: 1,
      event: "Receive and carry",
      eventType: "carry",
      possession: "home",
      carrierId: "home-runner",
      ballStateType: "controlled",
      pressureCount: 1,
      ball: { x: 7.2, y: 3.3 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 3.1, away: 2.8 },
    },
    {
      tick: 3,
      half: 1,
      event: "Shot blocked",
      eventType: "save",
      possession: "home",
      ballStateType: "loose",
      pressureCount: 2,
      ball: { x: 9.2, y: 3.8 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 3, away: 2.6 },
    },
    {
      tick: 4,
      half: 1,
      event: "Home recover the second ball",
      eventType: "recovery",
      possession: "home",
      carrierId: "home-forward",
      ballStateType: "controlled",
      pressureCount: 1,
      ball: { x: 8.9, y: 4.1 },
      score: { home: 0, away: 0 },
      averageTeamSpacing: { home: 2.9, away: 2.5 },
    },
    {
      tick: 5,
      half: 1,
      event: "Home finish the move",
      eventType: "goal",
      possession: "away",
      carrierId: "away-link",
      ballStateType: "controlled",
      pressureCount: 0,
      ball: { x: 6, y: 4 },
      score: { home: 1, away: 0 },
      averageTeamSpacing: { home: 2.7, away: 2.8 },
    },
    {
      tick: 6,
      half: 2,
      event: "Away intercept through anchor",
      eventType: "turnover",
      possession: "away",
      carrierId: "away-anchor",
      ballStateType: "controlled",
      pressureCount: 2,
      ball: { x: 5.3, y: 4.1 },
      score: { home: 1, away: 0 },
      averageTeamSpacing: { home: 2.8, away: 2.9 },
    },
    {
      tick: 7,
      half: 2,
      event: "Away pass toward forward",
      eventType: "pass",
      possession: "away",
      ballStateType: "in-transit",
      pressureCount: 1,
      ball: { x: 4.4, y: 4.2 },
      score: { home: 1, away: 0 },
      averageTeamSpacing: { home: 2.8, away: 3 },
    },
  ],
};

describe("scoreTrace", () => {
  it("scores stronger traces above obviously weak ones", () => {
    const weak = scoreTrace(weakTrace);
    const stronger = scoreTrace(strongerTrace);

    expect(stronger.overall).toBeGreaterThan(weak.overall);
    expect(stronger.categories.offBallShape.score).toBeGreaterThan(weak.categories.offBallShape.score);
    expect(stronger.categories.chanceCreation.score).toBeGreaterThan(weak.categories.chanceCreation.score);
  });
});

