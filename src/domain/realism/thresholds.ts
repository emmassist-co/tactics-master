import type { ReadinessThresholds, TraceScorecard } from "./types";

export const REALISM_THRESHOLDS: ReadinessThresholds = {
  categoryFloors: {
    offBallShape: 3.5,
    ballInteractions: 3.5,
    defending: 3.5,
    chanceCreation: 3.5,
  },
  overallFloor: 4,
};

export function evaluateReadiness(scorecard: Omit<TraceScorecard, "ready" | "failedCategories">): Pick<
  TraceScorecard,
  "ready" | "failedCategories"
> {
  const failedCategories = Object.entries(scorecard.categories)
    .filter(([category, score]) => score.score < REALISM_THRESHOLDS.categoryFloors[category as keyof typeof REALISM_THRESHOLDS.categoryFloors])
    .map(([category]) => category) as TraceScorecard["failedCategories"];

  const ready = failedCategories.length === 0 && scorecard.overall >= REALISM_THRESHOLDS.overallFloor;

  return { ready, failedCategories };
}

