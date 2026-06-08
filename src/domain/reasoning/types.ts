import type { TeamSide, TacticalPlan } from "../tactics/types";
import type { MatchSnapshot } from "../match/types";

export type TeamDecisionWindow =
  | "kickoff"
  | "build-up"
  | "final-third"
  | "under-pressure"
  | "transition"
  | "halftime-reset";

export interface TeamTurnContext {
  side: TeamSide;
  window: TeamDecisionWindow;
  half: 1 | 2;
  scoreDelta: number;
  plan: TacticalPlan;
  event: string;
  possession: TeamSide;
  ballZone: "defensive-third" | "middle-third" | "attacking-third";
  visibleSummary: string;
  snapshot: MatchSnapshot;
}

export interface TeamDecision {
  side: TeamSide;
  window: TeamDecisionWindow;
  objective: "retain" | "progress" | "probe" | "counter" | "press" | "protect" | "finish";
  targetZone: "left" | "center" | "right";
  supportStyle: "hold-shape" | "offer-short" | "overlap" | "attack-box" | "collapse";
  ballAction: "pass" | "carry" | "switch" | "clear" | "shoot";
  pressing: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  likelyActorRole?: "keeper" | "anchor" | "link" | "runner" | "forward";
  preferredReceiverRole?: "anchor" | "link" | "runner" | "forward";
  eventLabel: string;
  explanation: string;
}

export interface TeamTurnProvider {
  decide(context: TeamTurnContext): Promise<TeamDecision>;
}
