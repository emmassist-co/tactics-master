import type { MatchIntent, MatchState } from "./types";
import { ballPositionFromState, clamp, direction, distance, otherSide, playerById, pressurePlayers, teamPlayers, withController } from "./transition";
import { MATCH_TUNING } from "./tuning";
import { resolveShot } from "./resolveShot";
import type { MatchSnapshot } from "../match/types";

function interceptionChance(state: MatchState, receiverId: string, attackingSide: "home" | "away"): number {
  const receiver = playerById(state, receiverId);
  const carrier = state.carrierId ? playerById(state, state.carrierId) : undefined;
  const defenders = teamPlayers(state, otherSide(attackingSide));
  const nearest = defenders.reduce((lowest, defender) => {
    const next = distance(defender.position, receiver.position);
    return Math.min(lowest, next);
  }, Number.POSITIVE_INFINITY);
  const support = teamPlayers(state, attackingSide)
    .filter((player) => player.id !== receiver.id && player.id !== carrier?.id)
    .reduce((lowest, teammate) => Math.min(lowest, distance(teammate.position, receiver.position)), Number.POSITIVE_INFINITY);
  const passLength = carrier ? distance(carrier.position, receiver.position) : 0;

  let chance = nearest < MATCH_TUNING.passInterceptCloseDistance
    ? MATCH_TUNING.passInterceptHighChance
    : nearest < MATCH_TUNING.passInterceptMidDistance
      ? MATCH_TUNING.passInterceptMidChance
      : MATCH_TUNING.passInterceptLowChance;

  if (passLength > 3.4) chance += 0.05;
  if (support < 1.5) chance -= 0.05;
  if (support > 2.8) chance += 0.04;

  return Math.max(0, Math.min(1, chance));
}

export function startPass(state: MatchState, intent: MatchIntent): MatchSnapshot {
  const receiver = playerById(state, intent.targetId ?? intent.actorId);
  const passer = playerById(state, intent.actorId);
  const advance =
    intent.action === "clear"
      ? MATCH_TUNING.passAdvanceClear
      : intent.action === "switch"
        ? MATCH_TUNING.passAdvanceSwitch
        : intent.riskLevel === "high"
          ? MATCH_TUNING.passAdvanceHighRisk
          : MATCH_TUNING.passAdvanceBase;
  const supportWindow = distance(receiver.position, passer.position) < 1.9;
  const targetAdvance =
    intent.action === "clear"
      ? advance
      : supportWindow && intent.riskLevel !== "high"
        ? advance * 0.45
        : advance;
  const target = {
    x: clamp(receiver.position.x + direction(intent.side) * targetAdvance, 0, 12),
    y: receiver.position.y,
  };
  const players = withController(state.players, undefined);
  return {
    ...state,
    players,
    ballState: {
      type: "in-transit",
      fromId: intent.actorId,
      toId: receiver.id,
      side: intent.side,
      target,
      progress: MATCH_TUNING.passTransitStartProgress,
      action: intent.action === "clear" ? "clear" : intent.action === "switch" ? "switch" : "pass",
    },
    ball: ballPositionFromState(
      {
        type: "in-transit",
        fromId: intent.actorId,
        toId: receiver.id,
        side: intent.side,
        target,
        progress: MATCH_TUNING.passTransitStartProgress,
        action: intent.action === "clear" ? "clear" : intent.action === "switch" ? "switch" : "pass",
      },
      players,
    ),
    carrierId: undefined,
    pressure: pressurePlayers({ ...state, players }, undefined),
    event: `${intent.side === "home" ? "Home" : "Away"} ${
      intent.action === "switch" ? "switch" : intent.action === "clear" ? "clear" : "pass"
    } toward ${receiver.role}`,
    eventType: "pass",
  };
}

export function resolveTransit(state: MatchState): MatchSnapshot {
  if (state.ballState?.type !== "in-transit") {
    return state;
  }
  const transitBall = state.ballState;

  if (transitBall.progress < 1) {
    const nextBallState = {
      ...transitBall,
      progress: Math.min(1, transitBall.progress + MATCH_TUNING.passTransitStep),
    };
    return {
      ...state,
      ballState: nextBallState,
      ball: ballPositionFromState(nextBallState, state.players),
      event: state.event,
      eventType: "pass",
    };
  }

  const chance = interceptionChance(state, transitBall.toId, transitBall.side);
  const receiver = playerById(state, transitBall.toId);
  const defenders = teamPlayers(state, otherSide(transitBall.side))
    .map((player) => ({ player, d: distance(player.position, receiver.position) }))
    .sort((left, right) => left.d - right.d);

  if (chance > 0.2 && defenders[0] && defenders[0].d < MATCH_TUNING.passInterceptResolveDistance) {
    if (chance < 0.28 && transitBall.action !== "clear") {
      const looseLocation = {
        x: clamp((transitBall.target.x + defenders[0].player.position.x) / 2, 0.4, 11.6),
        y: clamp((transitBall.target.y + defenders[0].player.position.y) / 2, 0.6, 7.4),
      };
      const players = withController(state.players, undefined);
      return {
        ...state,
        players,
        ballState: {
          type: "loose",
          location: looseLocation,
          source: "bad-pass",
          lastTouchSide: transitBall.side,
          age: 0,
      },
      ball: looseLocation,
      carrierId: undefined,
      pressure: [defenders[0].player.id],
      event: `${transitBall.side === "home" ? "Home" : "Away"} pass ricochets loose under pressure`,
      eventType: "pass",
    };
  }

    const interceptor = defenders[0].player;
    const players = withController(state.players, interceptor.id);
    return {
      ...state,
      players,
      ballState: {
        type: "controlled",
        playerId: interceptor.id,
        side: interceptor.side,
      },
      ball: interceptor.position,
      carrierId: interceptor.id,
      possession: interceptor.side,
      pressure: pressurePlayers({ ...state, players }, interceptor.id),
      event: `${interceptor.side === "home" ? "Home" : "Away"} intercept through ${interceptor.role}`,
      eventType: "turnover",
    };
  }

  const players = withController(state.players, receiver.id);
  const receivingPlayers = players.map((player) =>
    player.id === receiver.id
      ? {
          ...player,
          position: {
            x: transitBall.action === "clear" ? clamp(transitBall.target.x, 0.4, 11.6) : transitBall.target.x,
            y: transitBall.target.y,
          },
          target: transitBall.target,
        }
      : player,
  );
  const receptionPressure = pressurePlayers({ ...state, players: receivingPlayers }, receiver.id);
  if (
    transitBall.action === "pass" &&
    defenders[0] &&
    defenders[0].d < 1.25 &&
    receptionPressure.length > 0 &&
    chance > 0.18
  ) {
    const looseLocation = {
      x: clamp((transitBall.target.x + defenders[0].player.position.x) / 2, 0.4, 11.6),
      y: clamp((transitBall.target.y + defenders[0].player.position.y) / 2, 0.6, 7.4),
    };
    const loosePlayers = withController(receivingPlayers, undefined);
    return {
      ...state,
      players: loosePlayers,
      ballState: {
        type: "loose",
        location: looseLocation,
        source: "bad-pass",
        lastTouchSide: transitBall.side,
        age: 0,
      },
      ball: looseLocation,
      carrierId: undefined,
      pressure: [defenders[0].player.id],
      event: `${receiver.side === "home" ? "Home" : "Away"} heavy touch spills the pass loose`,
      eventType: "pass",
    };
  }

  const controlledState: MatchSnapshot = {
    ...state,
    players: receivingPlayers,
    ballState: {
      type: "controlled",
      playerId: receiver.id,
      side: receiver.side,
    },
    ball: transitBall.target,
    carrierId: receiver.id,
    possession: receiver.side,
    pressure: pressurePlayers({ ...state, players: receivingPlayers }, receiver.id),
    event: `${receiver.side === "home" ? "Home" : "Away"} find the ${receiver.role}`,
    eventType: "build-up",
  };
  const goalDistance = receiver.side === "home" ? 12 - transitBall.target.x : transitBall.target.x;
  if (
    transitBall.action !== "clear" &&
    goalDistance < 2.6 &&
    (receiver.role === "runner" || receiver.role === "forward")
  ) {
    return resolveShot(controlledState as MatchState, {
      side: receiver.side,
      actorId: receiver.id,
      actorRole: receiver.role,
      action: "shoot",
      targetZone: transitBall.target.y < 3.4 ? "left" : transitBall.target.y > 4.6 ? "right" : "center",
      riskLevel: goalDistance < 1.8 ? "high" : "medium",
    });
  }

  return {
    ...controlledState,
  };
}
