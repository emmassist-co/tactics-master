import { resolveCarry } from "./resolveCarry";
import { startPass, resolveTransit } from "./resolvePass";
import { resolveRecovery } from "./resolveRecovery";
import { resolveShot } from "./resolveShot";
import { selectIntent } from "./selectIntent";
import { clamp, direction, distance, otherSide, playerById, pressurePlayers } from "./transition";
import { MATCH_TUNING } from "./tuning";
import type { MatchState } from "./types";
import type { TeamDecision } from "../reasoning/types";
import type { PlayerRole } from "../match/types";

function laneY(role: PlayerRole): number {
  if (role === "keeper") return 4;
  if (role === "anchor") return 2.2;
  if (role === "link") return 3.35;
  if (role === "runner") return 5.8;
  if (role === "forward") return 4.6;
  return 4;
}

function roleDepth(role: PlayerRole): number {
  if (role === "keeper") return -4.2;
  if (role === "anchor") return -2.2;
  if (role === "link") return -0.8;
  if (role === "runner") return 1.15;
  return 2.2;
}

function laneWeight(role: PlayerRole): number {
  if (role === "anchor") return 0.25;
  if (role === "link") return 0.55;
  if (role === "forward") return 1.1;
  return 1;
}

function verticalPull(player: { role: PlayerRole }, ballY: number): number {
  if (player.role === "keeper") return 0;
  if (player.role === "anchor") return (ballY - laneY(player.role)) * 0.1;
  if (player.role === "link") return (ballY - laneY(player.role)) * 0.18;
  if (player.role === "runner") return (ballY - laneY(player.role)) * 0.14;
  return (ballY - laneY(player.role)) * 0.1;
}

function teamReferenceX(state: MatchState, side: "home" | "away") {
  const outfield = state.players.filter((player) => player.side === side && player.role !== "keeper");
  if (outfield.length === 0) return state.ball.x;
  return outfield.reduce((sum, player) => sum + player.position.x, 0) / outfield.length;
}

function stepValue(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

function targetForPlayer(
  state: MatchState,
  playerId: string,
  homeDecision: TeamDecision,
  awayDecision: TeamDecision,
): { x: number; y: number } {
  const player = playerById(state, playerId);
  const ownDecision = player.side === "home" ? homeDecision : awayDecision;
  const theirDecision = player.side === "home" ? awayDecision : homeDecision;
  const attacking = state.possession === player.side;
  const ball = state.ballState?.type === "loose" ? state.ballState.location : state.ball;

  if (state.ballState?.type === "loose") {
    if (distance(player.position, state.ballState.location) < MATCH_TUNING.looseBallChaseDistance) {
      return state.ballState.location;
    }
  }

  if (state.carrierId === player.id) {
    return {
      x: clamp(
        player.position.x +
          direction(player.side) *
            (player.role === "forward"
              ? MATCH_TUNING.carrierForwardStepHighRisk
              : MATCH_TUNING.carrierForwardStepBase),
        0.4,
        11.6,
      ),
      y: clamp(
        player.position.y +
          (ownDecision.targetZone === "left"
            ? -MATCH_TUNING.carrierLaneDrift
            : ownDecision.targetZone === "right"
              ? MATCH_TUNING.carrierLaneDrift
              : 0),
        0.8,
        7.2,
      ),
    };
  }

  if (!attacking) {
    const closeToBall = distance(player.position, ball);
    const teammates = state.players.filter((candidate) => candidate.side === player.side);
    const nearestTeammateDistance = teammates.reduce((lowest, candidate) => {
      if (candidate.id === player.id) return lowest;
      return Math.min(lowest, distance(candidate.position, ball));
    }, Number.POSITIVE_INFINITY);
    const engageDistance =
      player.role === theirDecision.likelyActorRole
        ? MATCH_TUNING.defensiveEngageDistance + 0.75
        : MATCH_TUNING.defensiveEngageDistance;
    const primaryPresser = closeToBall <= nearestTeammateDistance + 0.15;
    const secondaryPresser =
      player.role === theirDecision.likelyActorRole && closeToBall < engageDistance && closeToBall < nearestTeammateDistance + 0.55;
    if (closeToBall < engageDistance && (primaryPresser || secondaryPresser)) {
      return {
        x: clamp(ball.x + direction(player.side) * MATCH_TUNING.defensiveBallOffset, 0.4, 11.6),
        y: clamp(
          ball.y +
            (player.role === "anchor"
              ? MATCH_TUNING.defensiveAnchorYBias
              : player.role === "runner"
                ? MATCH_TUNING.defensiveRunnerYBias
                : 0),
          0.6,
          7.4,
        ),
      };
    }

    return {
      x: clamp(
        ball.x +
          direction(player.side) *
            (MATCH_TUNING.defensiveRetreatBase +
              Math.max(0, roleDepth(player.role) * MATCH_TUNING.defensiveRoleDepthFactor)),
        0.4,
        11.6,
      ),
      y: clamp(
        laneY(player.role) +
          verticalPull(player, ball.y) +
          (theirDecision.targetZone === "left"
            ? -MATCH_TUNING.defensiveLaneShift
            : theirDecision.targetZone === "right"
              ? MATCH_TUNING.defensiveLaneShift
              : 0),
        0.8,
        7.2,
      ),
    };
  }

  const supportDepth = roleDepth(player.role);
  const supportDepthOffset =
    ownDecision.objective === "retain"
      ? Math.min(supportDepth, supportDepth * 0.45)
      : ownDecision.objective === "probe"
        ? supportDepth * 0.85
        : ownDecision.objective === "finish"
          ? supportDepth + 0.45
          : supportDepth;
  const laneBias =
    player.role === "runner"
      ? ownDecision.targetZone === "left"
        ? -MATCH_TUNING.runnerLaneWideBias
        : ownDecision.targetZone === "right"
          ? MATCH_TUNING.runnerLaneWideBias
          : MATCH_TUNING.neutralRunnerLaneBias
      : ownDecision.targetZone === "left"
        ? -MATCH_TUNING.teamLaneBias * laneWeight(player.role)
        : ownDecision.targetZone === "right"
          ? MATCH_TUNING.teamLaneBias * laneWeight(player.role)
          : 0;
  const boxCrash = player.role === "forward" && ball.x > MATCH_TUNING.forwardBoxCrashXHome && player.side === "home";
  const awayBoxCrash = player.role === "forward" && ball.x < MATCH_TUNING.forwardBoxCrashXAway && player.side === "away";
  const preferredReceiverPush = player.role === ownDecision.preferredReceiverRole ? 0.45 : 0;
  const referenceX = teamReferenceX(state, player.side) * 0.45 + ball.x * 0.55;
  return {
    x: clamp(
      referenceX +
        direction(player.side) *
          (boxCrash || awayBoxCrash
            ? MATCH_TUNING.forwardBoxCrashDepth
            : supportDepthOffset + preferredReceiverPush),
      0.4,
      11.6,
    ),
    y: clamp(laneY(player.role) + laneBias + verticalPull(player, ball.y), 0.8, 7.2),
  };
}

function movePlayers(state: MatchState, decisions: Record<"home" | "away", TeamDecision>): MatchState {
  const players = state.players.map((player) => {
    const target = targetForPlayer(state, player.id, decisions.home, decisions.away);
    const speed =
      state.carrierId === player.id
        ? MATCH_TUNING.speedCarrier
        : player.side === state.possession
          ? MATCH_TUNING.speedAttacking
          : decisions[player.side].pressing === "high"
            ? MATCH_TUNING.speedPressing
            : MATCH_TUNING.speedContain;
    return {
      ...player,
      target,
      position: {
        x: stepValue(player.position.x, target.x, speed),
        y: stepValue(player.position.y, target.y, speed),
      },
      isPressuring: false,
      pressureLevel: 0,
      hasBall: false,
    };
  });

  const moved = { ...state, players };
  const pressure = pressurePlayers(moved, moved.carrierId);
  return {
    ...moved,
    pressure,
    players: players.map((player) => ({
      ...player,
      hasBall: player.id === moved.carrierId,
      isPressuring: pressure.includes(player.id),
      pressureLevel: pressure.includes(player.id) ? 1 : 0,
    })),
  };
}

export function simulateTick(
  state: MatchState,
  decisions: Record<"home" | "away", TeamDecision>,
): MatchState {
  let movedState = movePlayers(state, decisions);

  if (movedState.ballState?.type === "in-transit") {
    return {
      ...resolveTransit(movedState),
      tick: state.tick + 1,
      half: state.half,
      decisions,
    };
  }

  if (movedState.ballState?.type === "loose") {
    return {
      ...resolveRecovery(movedState),
      tick: state.tick + 1,
      half: state.half,
      decisions,
    };
  }

  const attackingDecision = decisions[movedState.possession];
  const intent = selectIntent(movedState, movedState.possession, attackingDecision);

  let nextState: MatchState;
  if (intent.action === "shoot") {
    nextState = resolveShot(movedState, intent);
  } else if (intent.action === "carry") {
    nextState = resolveCarry(movedState, intent);
  } else {
    nextState = startPass(movedState, intent);
  }

  const opponent = otherSide(movedState.possession);
  const defensivePressure = pressurePlayers(nextState, nextState.carrierId);
  return {
    ...nextState,
    tick: state.tick + 1,
    half: state.half,
    decisions,
    pressure: defensivePressure,
    players: nextState.players.map((player) => ({
      ...player,
      hasBall: player.id === nextState.carrierId,
      isPressuring: defensivePressure.includes(player.id),
      pressureLevel: defensivePressure.includes(player.id) ? 1 : 0,
    })),
    event:
      defensivePressure.length > 0 && nextState.carrierId && nextState.possession === opponent
        ? nextState.event
        : nextState.event,
  };
}
