import type { TeamDecision } from "../reasoning/types";
import type { MatchSnapshot, PlayerRole } from "../match/types";
import type { TacticalPlan, TeamSide } from "../tactics/types";

export type MatchAction = "pass" | "switch" | "carry" | "shoot" | "clear" | "recover" | "press";

export interface MatchIntent {
  side: TeamSide;
  actorId: string;
  actorRole: PlayerRole;
  action: MatchAction;
  targetId?: string;
  targetZone: TeamDecision["targetZone"];
  riskLevel: TeamDecision["riskLevel"];
}

export interface MatchState extends MatchSnapshot {
  openingPlans?: Record<TeamSide, TacticalPlan>;
  halftimePlans?: Record<TeamSide, TacticalPlan>;
}

