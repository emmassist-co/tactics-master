import type { TacticalBias, TacticalPlan, TeamSide } from "./types";

function riskFromBias(bias: TacticalBias): TacticalPlan["riskTolerance"] {
  if (bias.risk > 0.62) return "high";
  if (bias.risk < 0.4) return "low";
  return "medium";
}

function shapeFromBias(bias: TacticalBias): TacticalPlan["shapeFocus"] {
  if (bias.compactness > 0.62) return "compact";
  if (bias.width > 0.62) return "wide";
  return "balanced";
}

function mentalityFromBias(bias: TacticalBias): TacticalPlan["mentality"] {
  if (bias.passingBias > 0.62) return "control";
  if (bias.forwardRuns + bias.shooting > 1.2) return "direct";
  return "balanced";
}

function transitionFromBias(bias: TacticalBias): TacticalPlan["transitionStyle"] {
  if (bias.pressing > 0.62) return "press";
  if (bias.forwardRuns > 0.6 || bias.tempo > 0.62) return "counter";
  return "contain";
}

export function createTacticalPlan(side: TeamSide, rawPrompt: string, bias: TacticalBias): TacticalPlan {
  const priorities: string[] = [];
  if (bias.compactness > 0.58) priorities.push("protect central shape");
  if (bias.pressing > 0.58) priorities.push("attack the ball quickly");
  if (bias.passingBias > 0.58) priorities.push("build combinations");
  if (bias.forwardRuns > 0.56) priorities.push("send support runners");
  if (bias.shooting > 0.56) priorities.push("attack the box early");

  if (priorities.length === 0) {
    priorities.push("stay balanced", "keep the duel moving");
  }

  return {
    side,
    rawPrompt,
    summary: bias.summary,
    shapeFocus: shapeFromBias(bias),
    mentality: mentalityFromBias(bias),
    transitionStyle: transitionFromBias(bias),
    riskTolerance: riskFromBias(bias),
    priorities,
    bias,
  };
}
