import type { TacticalPlan, TeamSide } from "../tactics/types";
import type { TeamDecision } from "../reasoning/types";
import type { GridPosition, MatchSnapshot, PlayerState } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function direction(side: TeamSide): number {
  return side === "home" ? 1 : -1;
}

function laneTarget(role: PlayerState["role"], side: TeamSide): number {
  if (role === "keeper") return side === "home" ? 1 : 11;
  if (role === "anchor") return side === "home" ? 3 : 9;
  if (role === "link") return 5.5;
  if (role === "runner") return side === "home" ? 5 : 7;
  return side === "home" ? 8 : 4;
}

export function deriveTarget(
  player: PlayerState,
  possession: TeamSide,
  plan: TacticalPlan,
  decision: TeamDecision,
): GridPosition {
  const dir = direction(player.side);
  const attackBias = possession === player.side ? 1 : -1;
  const compactPull = (0.5 - plan.bias.width) * 3;
  const supportBoost =
    decision.supportStyle === "attack-box" ? 2.2 : decision.supportStyle === "overlap" ? 1.8 : 1.2;
  const x = laneTarget(player.role, player.side) + attackBias * dir * supportBoost;
  const yBase = player.role === "anchor" ? 2.5 : player.role === "runner" ? 5.5 : player.position.y;
  const zoneBias = decision.targetZone === "left" ? -0.8 : decision.targetZone === "right" ? 0.8 : 0;
  const y = clamp(yBase + compactPull + zoneBias, 1, 7);
  return {
    x: clamp(x, 0.5, 11.5),
    y,
  };
}

function moveTowards(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function stepPlayers(
  players: PlayerState[],
  possession: TeamSide,
  plans: Record<TeamSide, TacticalPlan>,
  decisions: Record<TeamSide, TeamDecision>,
): PlayerState[] {
  return players.map((player) => {
    const plan = plans[player.side];
    const decision = decisions[player.side];
    const target = deriveTarget(player, possession, plan, decision);
    const speed =
      player.side === possession
        ? 0.34 + plan.bias.tempo * 0.14
        : 0.27 + (decision.pressing === "high" ? 0.18 : decision.pressing === "medium" ? 0.1 : 0.03);
    return {
      ...player,
      target,
      position: {
        x: moveTowards(player.position.x, target.x, speed),
        y: moveTowards(player.position.y, target.y, speed),
      },
    };
  });
}

export function resolveBall(
  snapshot: MatchSnapshot,
  plans: Record<TeamSide, TacticalPlan>,
  decisions: Record<TeamSide, TeamDecision>,
): { ball: GridPosition; possession: TeamSide; goalFor?: TeamSide } {
  const side = snapshot.possession;
  const attackPlan = plans[side];
  const attackDecision = decisions[side];
  const actionBoost =
    attackDecision.ballAction === "switch" ? 0.52 : attackDecision.ballAction === "carry" ? 0.46 : 0.38;
  const nextX =
    snapshot.ball.x +
    direction(side) * (actionBoost + attackPlan.bias.tempo * 0.22 + attackPlan.bias.forwardRuns * 0.18);
  const nextY = clamp(
    snapshot.ball.y + (attackPlan.bias.width - 0.5) * 0.6 + (Math.sin(snapshot.tick) * 0.08),
    1,
    7,
  );

  const defendSide = side === "home" ? "away" : "home";
  const defendPlan = plans[defendSide];
  const defendDecision = decisions[defendSide];
  const pressingValue =
    defendDecision.pressing === "high" ? 0.9 : defendDecision.pressing === "medium" ? 0.55 : 0.25;
  const turnoverChance = pressingValue * 0.18 - attackPlan.bias.passingBias * 0.1;
  if (turnoverChance > 0.08 && snapshot.tick % 6 === 0) {
    return {
      ball: { x: snapshot.ball.x, y: snapshot.ball.y },
      possession: defendSide,
    };
  }

  const homeGoal = nextX >= 12;
  const awayGoal = nextX <= 0;
  if (homeGoal) {
    const chanceStrength =
      attackPlan.bias.shooting +
      attackPlan.bias.risk +
      attackPlan.bias.forwardRuns +
      (attackDecision.objective === "finish" ? 0.18 : 0);
    if (chanceStrength > 1.35 || snapshot.tick % 9 === 0) {
      return { ball: { x: 6, y: 4 }, possession: "away", goalFor: "home" };
    }
  }

  if (awayGoal) {
    const chanceStrength =
      attackPlan.bias.shooting +
      attackPlan.bias.risk +
      attackPlan.bias.forwardRuns +
      (attackDecision.objective === "finish" ? 0.18 : 0);
    if (chanceStrength > 1.35 || snapshot.tick % 9 === 0) {
      return { ball: { x: 6, y: 4 }, possession: "home", goalFor: "away" };
    }
  }

  return {
    ball: { x: clamp(nextX, 0, 12), y: nextY },
    possession: side,
  };
}
