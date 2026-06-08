import { keywordPlanProvider } from "../tactics/providers/keywordPlanProvider";
import type { TacticalPlan, TeamSide } from "../tactics/types";

export function applyHalftimePrompts(prompts: Record<TeamSide, string>): Record<TeamSide, TacticalPlan> {
  return {
    home: keywordPlanProvider("home", prompts.home),
    away: keywordPlanProvider("away", prompts.away),
  };
}
