import type { BallState, GridPosition, PlayerState } from "../match/types";
import type { MatchState } from "./types";
import type { TeamSide } from "../tactics/types";
import { MATCH_TUNING } from "./tuning";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: GridPosition, b: GridPosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function direction(side: TeamSide): number {
  return side === "home" ? 1 : -1;
}

export function otherSide(side: TeamSide): TeamSide {
  return side === "home" ? "away" : "home";
}

export function centerGoal(side: TeamSide): GridPosition {
  return side === "home" ? { x: 12, y: 4 } : { x: 0, y: 4 };
}

export function teamPlayers(state: MatchState, side: TeamSide): PlayerState[] {
  return state.players.filter((player) => player.side === side);
}

export function playerById(state: MatchState, playerId: string): PlayerState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Unknown player: ${playerId}`);
  }
  return player;
}

export function withController(players: PlayerState[], playerId?: string): PlayerState[] {
  return players.map((player) => ({
    ...player,
    hasBall: player.id === playerId,
  }));
}

export function ballPositionFromState(state: BallState, players: PlayerState[]): GridPosition {
  if (state.type === "controlled") {
    const controller = players.find((player) => player.id === state.playerId);
    return controller ? controller.position : { x: 6, y: 4 };
  }
  if (state.type === "in-transit") {
    const from = players.find((player) => player.id === state.fromId);
    if (!from) return state.target;
    return {
      x: from.position.x + (state.target.x - from.position.x) * state.progress,
      y: from.position.y + (state.target.y - from.position.y) * state.progress,
    };
  }
  return state.location;
}

export function pressurePlayers(state: MatchState, carrierId?: string): string[] {
  if (!carrierId) return [];
  const carrier = state.players.find((player) => player.id === carrierId);
  if (!carrier) return [];
  return state.players
    .filter((player) => player.side !== carrier.side)
    .map((player) => ({ player, d: distance(player.position, carrier.position) }))
    .filter(({ d }) => d < MATCH_TUNING.pressureRadius)
    .sort((left, right) => left.d - right.d)
    .slice(0, MATCH_TUNING.pressureMaxPlayers)
    .map(({ player }) => player.id);
}
