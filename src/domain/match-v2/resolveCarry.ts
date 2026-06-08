import type { MatchIntent, MatchState } from "./types";
import { clamp, direction, distance, otherSide, playerById, pressurePlayers, teamPlayers, withController } from "./transition";
import { MATCH_TUNING } from "./tuning";
import { resolveShot } from "./resolveShot";
import type { MatchSnapshot } from "../match/types";

export function resolveCarry(state: MatchState, intent: MatchIntent): MatchSnapshot {
  const carrier = playerById(state, intent.actorId);
  const defenders = teamPlayers(state, otherSide(intent.side))
    .map((player) => ({ player, d: distance(player.position, carrier.position) }))
    .sort((left, right) => left.d - right.d);
  const nearest = defenders[0];
  const tackleRisk =
    nearest && nearest.d < MATCH_TUNING.carryTackleCloseDistance
      ? MATCH_TUNING.carryTackleHighRisk
      : nearest && nearest.d < MATCH_TUNING.carryTackleMidDistance
        ? MATCH_TUNING.carryTackleMidRisk
        : MATCH_TUNING.carryTackleLowRisk;

  if (nearest && tackleRisk > 0.36) {
    const looseLocation = {
      x: clamp((carrier.position.x + nearest.player.position.x) / 2, 0, 12),
      y: clamp((carrier.position.y + nearest.player.position.y) / 2, 0.5, 7.5),
    };
    const players = withController(state.players, undefined);
    return {
      ...state,
      players,
      ballState: {
        type: "loose",
        location: looseLocation,
        source: "tackle",
        lastTouchSide: intent.side,
        age: 0,
      },
      ball: looseLocation,
      carrierId: undefined,
      pressure: [nearest.player.id],
      event: `${nearest.player.side === "home" ? "Home" : "Away"} tackle pops the ball loose`,
      eventType: "carry",
    };
  }

  const moveX =
    carrier.position.x +
    direction(intent.side) *
      (intent.riskLevel === "high"
        ? MATCH_TUNING.carrierForwardStepHighRisk
        : MATCH_TUNING.carrierForwardStepBase);
  const laneDrift =
    intent.targetZone === "left"
      ? -MATCH_TUNING.carrierLaneDrift
      : intent.targetZone === "right"
        ? MATCH_TUNING.carrierLaneDrift
        : 0;
  const nextPosition = {
    x: clamp(moveX, 0.4, 11.6),
    y: clamp(carrier.position.y + laneDrift, 0.8, 7.2),
  };

  const players = withController(
    state.players.map((player) =>
      player.id === carrier.id
        ? {
            ...player,
            position: nextPosition,
            target: nextPosition,
          }
        : player,
    ),
    carrier.id,
  );
  const carriedState: MatchSnapshot = {
    ...state,
    players,
    ballState: {
      type: "controlled",
      playerId: carrier.id,
      side: intent.side,
    },
    ball: nextPosition,
    carrierId: carrier.id,
    possession: intent.side,
    pressure: pressurePlayers({ ...state, players }, carrier.id),
    event: `${intent.side === "home" ? "Home" : "Away"} carry through the ${intent.targetZone}`,
    eventType: "carry",
  };
  const goalDistance = intent.side === "home" ? 12 - nextPosition.x : nextPosition.x;
  if (goalDistance < 3.2 && (!nearest || nearest.d > 1.15 || intent.riskLevel !== "low")) {
    return resolveShot(carriedState as MatchState, {
      ...intent,
      action: "shoot",
    });
  }

  return carriedState;
}
