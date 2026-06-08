export type TeamSide = "home" | "away";

export interface TacticalBias {
  compactness: number;
  pressing: number;
  passingBias: number;
  width: number;
  tempo: number;
  forwardRuns: number;
  risk: number;
  shooting: number;
  summary: string;
  rawPrompt: string;
}

export interface TacticalPlan {
  side: TeamSide;
  rawPrompt: string;
  summary: string;
  shapeFocus: "compact" | "balanced" | "wide";
  mentality: "control" | "balanced" | "direct";
  transitionStyle: "press" | "contain" | "counter";
  riskTolerance: "low" | "medium" | "high";
  priorities: string[];
  bias: TacticalBias;
}
