import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "./thresholds";

describe("evaluateReadiness", () => {
  it("passes only when all category floors and the overall score clear the gate", () => {
    const { ready, failedCategories } = evaluateReadiness({
      categories: {
        offBallShape: { category: "offBallShape", score: 4, summary: "", metrics: {} },
        ballInteractions: { category: "ballInteractions", score: 4.1, summary: "", metrics: {} },
        defending: { category: "defending", score: 3.6, summary: "", metrics: {} },
        chanceCreation: { category: "chanceCreation", score: 3.7, summary: "", metrics: {} },
      },
      overall: 4.05,
    });

    expect(ready).toBe(true);
    expect(failedCategories).toEqual([]);
  });

  it("fails when one category misses the floor even if the overall score passes", () => {
    const { ready, failedCategories } = evaluateReadiness({
      categories: {
        offBallShape: { category: "offBallShape", score: 4.4, summary: "", metrics: {} },
        ballInteractions: { category: "ballInteractions", score: 4.2, summary: "", metrics: {} },
        defending: { category: "defending", score: 3.4, summary: "", metrics: {} },
        chanceCreation: { category: "chanceCreation", score: 4.1, summary: "", metrics: {} },
      },
      overall: 4.1,
    });

    expect(ready).toBe(false);
    expect(failedCategories).toEqual(["defending"]);
  });
});

