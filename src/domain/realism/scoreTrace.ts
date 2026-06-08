import { scoreBallInteractions } from "./metrics/ballInteractions";
import { scoreChanceCreation } from "./metrics/chanceCreation";
import { scoreDefending } from "./metrics/defending";
import { scoreShape } from "./metrics/shape";
import { evaluateReadiness } from "./thresholds";
import type { MatchTrace, TraceScorecard } from "./types";

export function scoreTrace(trace: MatchTrace): TraceScorecard {
  const categories: TraceScorecard["categories"] = {
    offBallShape: {
      category: "offBallShape",
      ...scoreShape(trace),
    },
    ballInteractions: {
      category: "ballInteractions",
      ...scoreBallInteractions(trace),
    },
    defending: {
      category: "defending",
      ...scoreDefending(trace),
    },
    chanceCreation: {
      category: "chanceCreation",
      ...scoreChanceCreation(trace),
    },
  };

  const overall = Number(
    (
      categories.offBallShape.score * 0.3 +
      categories.ballInteractions.score * 0.25 +
      categories.defending.score * 0.2 +
      categories.chanceCreation.score * 0.25
    ).toFixed(2),
  );

  const { ready, failedCategories } = evaluateReadiness({ categories, overall });

  return { categories, overall, ready, failedCategories };
}

