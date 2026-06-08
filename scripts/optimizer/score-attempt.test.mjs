import { describe, expect, it } from "vitest";
import { compareAttempt } from "./score-attempt.mjs";

describe("compareAttempt", () => {
  const baseline = {
    averageOverall: 3.3,
    readyCount: 0,
    categoryAverages: {
      offBallShape: 2.28,
      ballInteractions: 3.41,
      defending: 3.48,
      chanceCreation: 4.26,
    },
  };

  it("accepts a meaningful aggregate improvement with one small category regression", () => {
    const candidate = {
      averageOverall: 3.55,
      readyCount: 1,
      categoryAverages: {
        offBallShape: 2.7,
        ballInteractions: 3.3,
        defending: 3.82,
        chanceCreation: 4.31,
      },
    };

    const result = compareAttempt({
      baselineReport: baseline,
      candidateReport: candidate,
    });

    expect(result.win).toBe(true);
    expect(result.regressedCategories).toEqual([]);
  });

  it("rejects noisy improvements below the minimum delta", () => {
    const candidate = {
      averageOverall: 3.31,
      readyCount: 0,
      categoryAverages: {
        offBallShape: 2.3,
        ballInteractions: 3.39,
        defending: 3.5,
        chanceCreation: 4.26,
      },
    };

    const result = compareAttempt({
      baselineReport: baseline,
      candidateReport: candidate,
    });

    expect(result.win).toBe(false);
  });
});
