import type { MatchIntent, MatchState } from "./types";
import type { PlayerState } from "../match/types";
import type { TeamDecision } from "../reasoning/types";
import type { TeamSide } from "../tactics/types";

function direction(side: TeamSide): number {
  return side === "home" ? 1 : -1;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function relativeX(side: TeamSide, x: number): number {
  return side === "home" ? x : 12 - x;
}

function distanceToSegment(point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (segmentLengthSquared === 0) return distance(point, start);
  const projection = ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLengthSquared;
  const clamped = Math.max(0, Math.min(1, projection));
  const projected = {
    x: start.x + segmentX * clamped,
    y: start.y + segmentY * clamped,
  };
  return distance(point, projected);
}

function sortByTargetZone(
  players: PlayerState[],
  zone: TeamDecision["targetZone"],
  side: TeamSide,
): PlayerState[] {
  return [...players].sort((left, right) => {
    const laneBias = (player: PlayerState) => {
      if (zone === "center") {
        return Math.abs(player.position.y - 4);
      }
      if (zone === "left") {
        return side === "home" ? player.position.y : 8 - player.position.y;
      }
      return side === "home" ? 8 - player.position.y : player.position.y;
    };
    return laneBias(left) - laneBias(right);
  });
}

function findByRole(players: PlayerState[], role: TeamDecision["likelyActorRole"]): PlayerState | undefined {
  return role ? players.find((player) => player.role === role) : undefined;
}

function nearestPlayer(players: PlayerState[], point: { x: number; y: number }): PlayerState {
  return [...players].sort((left, right) => distance(left.position, point) - distance(right.position, point))[0];
}

function chooseReceiver(
  teammates: PlayerState[],
  opponents: PlayerState[],
  decision: TeamDecision,
  carrier: PlayerState,
  side: TeamSide,
): PlayerState {
  const preferred = teammates.filter((player) => player.id !== carrier.id && player.role !== "keeper");
  const carrierProgress = relativeX(side, carrier.position.x);
  const openness = (candidate: PlayerState) =>
    opponents
      .reduce((lowest, player) => Math.min(lowest, distance(player.position, candidate.position)), Number.POSITIVE_INFINITY);
  const lineSafety = (candidate: PlayerState) =>
    opponents.reduce((lowest, player) => {
      return Math.min(lowest, distanceToSegment(player.position, carrier.position, candidate.position));
    }, Number.POSITIVE_INFINITY);

  const scoreReceiver = (candidate: PlayerState) => {
    const targetRank = sortByTargetZone(preferred, decision.targetZone, side).findIndex((player) => player.id === candidate.id);
    const zoneScore = targetRank === -1 ? 0 : Math.max(0, preferred.length - targetRank) * 0.18;
    const progress = relativeX(side, candidate.position.x) - carrierProgress;
    const goalGain = 12 - relativeX(side, candidate.position.x);
    const supportDistance = distance(candidate.position, carrier.position);
    const defenderGap = openness(candidate);
    const passingLane = lineSafety(candidate);
    const roleBonus = candidate.role === decision.preferredReceiverRole ? 0.75 : 0;
    const aheadBonus = progress > 0.25 ? 0.45 : progress < -0.2 ? -0.4 : 0;
    const laneScore = passingLane * 0.4;
    const backwardPenalty =
      (decision.objective === "progress" || decision.objective === "probe" || decision.objective === "counter" || decision.objective === "finish") &&
      progress < -0.05
        ? 1.1
        : 0;

    if (decision.objective === "retain" || decision.objective === "protect") {
      return roleBonus + zoneScore + defenderGap * 0.45 + laneScore - supportDistance * 0.55 + progress * 0.08;
    }

    if (decision.objective === "counter" || decision.riskLevel === "high") {
      return (
        roleBonus +
        zoneScore +
        defenderGap * 0.25 +
        laneScore +
        aheadBonus -
        backwardPenalty -
        supportDistance * 0.12 +
        progress * 0.42 -
        goalGain * 0.04
      );
    }

    return (
      roleBonus +
      zoneScore +
      defenderGap * 0.35 +
      laneScore +
      aheadBonus -
      backwardPenalty -
      supportDistance * 0.28 +
      progress * 0.34 -
      goalGain * 0.02
    );
  };

  return [...preferred].sort((left, right) => scoreReceiver(right) - scoreReceiver(left))[0];
}

export function selectIntent(
  state: MatchState,
  side: TeamSide,
  decision: TeamDecision,
): MatchIntent {
  const teammates = state.players.filter((player) => player.side === side);
  const opponents = state.players.filter((player) => player.side !== side);
  const carrier =
    state.carrierId && teammates.find((player) => player.id === state.carrierId)
      ? teammates.find((player) => player.id === state.carrierId)
      : undefined;

  if (state.ballState?.type === "loose") {
    const actor = findByRole(teammates, decision.likelyActorRole) ?? nearestPlayer(teammates, state.ballState.location);
    return {
      side,
      actorId: actor.id,
      actorRole: actor.role,
      action: "recover",
      targetZone: decision.targetZone,
      riskLevel: decision.riskLevel,
    };
  }

  if (state.possession !== side || !carrier) {
    const pressureTarget =
      state.ballState?.type === "in-transit"
        ? state.ballState.target
        : state.ballState?.type === "controlled"
          ? state.ball
          : state.ball;
    const actor = findByRole(teammates, decision.likelyActorRole) ?? nearestPlayer(teammates, pressureTarget);
    return {
      side,
      actorId: actor.id,
      actorRole: actor.role,
      action: "press",
      targetZone: decision.targetZone,
      riskLevel: decision.riskLevel,
    };
  }

  const goalDistance = side === "home" ? 12 - carrier.position.x : carrier.position.x;
  if (
    state.half === 2 &&
    state.score.home === state.score.away &&
    goalDistance < 6.2 &&
    (decision.riskLevel === "high" || state.tick >= 30)
  ) {
    return {
      side,
      actorId: carrier.id,
      actorRole: carrier.role,
      action: "shoot",
      targetZone: decision.targetZone,
      riskLevel: decision.riskLevel,
    };
  }

  if (decision.ballAction === "shoot") {
    return {
      side,
      actorId: carrier.id,
      actorRole: carrier.role,
      action: "shoot",
      targetZone: decision.targetZone,
      riskLevel: decision.riskLevel,
    };
  }

  if (decision.ballAction === "carry") {
    return {
      side,
      actorId: carrier.id,
      actorRole: carrier.role,
      action: "carry",
      targetZone: decision.targetZone,
      riskLevel: decision.riskLevel,
    };
  }

  const receiver = chooseReceiver(teammates, opponents, decision, carrier, side);
  return {
    side,
    actorId: carrier.id,
    actorRole: carrier.role,
    action: decision.ballAction === "clear" ? "clear" : decision.ballAction === "switch" ? "switch" : "pass",
    targetId: receiver.id,
    targetZone: decision.targetZone,
    riskLevel: decision.riskLevel,
  };
}
