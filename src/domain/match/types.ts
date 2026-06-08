import type { TacticalPlan, TeamSide } from "../tactics/types";
import type { TeamDecision, TeamDecisionWindow } from "../reasoning/types";

export interface GridPosition {
  x: number;
  y: number;
}

export type PlayerRole = "keeper" | "anchor" | "link" | "runner" | "forward";

export interface PlayerState {
  id: string;
  side: TeamSide;
  role: PlayerRole;
  position: GridPosition;
  target: GridPosition;
  hasBall: boolean;
  isPressuring?: boolean;
  pressureLevel?: number;
}

export type BallState =
  | {
      type: "controlled";
      playerId: string;
      side: TeamSide;
    }
  | {
      type: "in-transit";
      fromId: string;
      toId: string;
      side: TeamSide;
      target: GridPosition;
      progress: number;
      action: "pass" | "switch" | "clear";
    }
  | {
      type: "loose";
      location: GridPosition;
      source: "tackle" | "interception" | "block" | "save" | "rebound" | "bad-pass";
      lastTouchSide: TeamSide;
      age: number;
    };

export interface MatchSnapshot {
  tick: number;
  half: 1 | 2;
  players: PlayerState[];
  ball: GridPosition;
  possession: TeamSide;
  ballState?: BallState;
  carrierId?: string;
  pressure?: string[];
  score: Record<TeamSide, number>;
  event?: string;
  eventType?: "build-up" | "pass" | "carry" | "turnover" | "shot" | "block" | "save" | "goal" | "recovery";
  decisionWindow?: TeamDecisionWindow;
  decisions?: Record<TeamSide, TeamDecision>;
}

export interface MatchResult {
  frames: MatchSnapshot[];
  winner: TeamSide | "draw";
  finalScore: Record<TeamSide, number>;
  openingPlans: Record<TeamSide, TacticalPlan>;
  halftimePlans: Record<TeamSide, TacticalPlan>;
}
