import { interpretPrompt } from "../interpreter";
import { createTacticalPlan } from "../plan";
import type { TacticalPlan, TeamSide } from "../types";

export function keywordPlanProvider(side: TeamSide, rawPrompt: string): TacticalPlan {
  return createTacticalPlan(side, rawPrompt, interpretPrompt(rawPrompt));
}
