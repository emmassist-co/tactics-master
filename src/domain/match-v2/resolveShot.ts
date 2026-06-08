import type { MatchIntent, MatchState } from "./types";
import { clamp, direction, distance, otherSide, playerById, pressurePlayers, teamPlayers, withController } from "./transition";
import { MATCH_TUNING } from "./tuning";
import type { MatchSnapshot } from "../match/types";

function shootingScore(state: MatchState, intent: MatchIntent): number {
  const shooter = playerById(state, intent.actorId);
  const defenders = teamPlayers(state, otherSide(intent.side));
  const nearest = defenders.reduce((lowest, defender) => {
    return Math.min(lowest, distance(defender.position, shooter.position));
  }, Number.POSITIVE_INFINITY);
  const goalDistance = intent.side === "home" ? 12 - shooter.position.x : shooter.position.x;
  const closeness =
    goalDistance < 2
      ? MATCH_TUNING.shotClosenessVeryNear
      : goalDistance < 3.5
        ? MATCH_TUNING.shotClosenessNear
        : goalDistance < 4.8
          ? MATCH_TUNING.shotClosenessMid
          : MATCH_TUNING.shotClosenessFar;
  const pressurePenalty =
    nearest < 1.1
      ? MATCH_TUNING.shotPressurePenaltyTight
      : nearest < 1.8
        ? MATCH_TUNING.shotPressurePenaltyNear
        : MATCH_TUNING.shotPressurePenaltyFar;
  const supportBonus = state.players.filter(
    (player) => player.side === intent.side && player.id !== shooter.id && distance(player.position, shooter.position) < 2.5,
  ).length * MATCH_TUNING.shotSupportBonusPerRunner;
  return (
    closeness +
    supportBonus -
    pressurePenalty +
    (intent.riskLevel === "high" ? MATCH_TUNING.shotRiskBonusHigh : 0)
  );
}

function resetKickoff(state: MatchState, concedingSide: "home" | "away"): MatchSnapshot {
  const restartId = concedingSide === "home" ? "home-link" : "away-link";
  const restartPlayer = playerById(state, restartId);
  const players = withController(state.players, restartId);
  return {
    ...state,
    players,
    ballState: {
      type: "controlled",
      playerId: restartId,
      side: concedingSide,
    },
    ball: restartPlayer.position,
    carrierId: restartId,
    possession: concedingSide,
    pressure: [],
  };
}

export function resolveShot(state: MatchState, intent: MatchIntent): MatchSnapshot {
  const shooter = playerById(state, intent.actorId);
  const shotValue = shootingScore(state, intent);
  const defenders = teamPlayers(state, otherSide(intent.side))
    .map((player) => ({ player, d: distance(player.position, shooter.position) }))
    .sort((left, right) => left.d - right.d);

  if (shotValue > MATCH_TUNING.shotScoreThreshold) {
    const scoredFor = intent.side;
    const score = { ...state.score };
    score[scoredFor] += 1;
    const restart = resetKickoff({ ...state, score }, otherSide(scoredFor));
    return {
      ...restart,
      event: `${scoredFor === "home" ? "Home" : "Away"} finish the move`,
      eventType: "goal",
      score,
    };
  }

  if (defenders[0] && defenders[0].d < MATCH_TUNING.shotBlockDistance) {
    const looseLocation = {
      x: clamp(shooter.position.x + direction(intent.side) * 0.6, 0, 12),
      y: clamp(shooter.position.y + (intent.targetZone === "left" ? -0.4 : intent.targetZone === "right" ? 0.4 : 0), 0.6, 7.4),
    };
    const players = withController(state.players, undefined);
    return {
      ...state,
      players,
      ballState: {
        type: "loose",
        location: looseLocation,
        source: "block",
        lastTouchSide: intent.side,
        age: 0,
      },
      ball: looseLocation,
      carrierId: undefined,
      pressure: [defenders[0].player.id],
      event: `${defenders[0].player.side === "home" ? "Home" : "Away"} block the shot`,
      eventType: "block",
    };
  }

  const keeperId = `${otherSide(intent.side)}-keeper`;
  const keeper = playerById(state, keeperId);
  const reboundLocation = {
    x: clamp((keeper.position.x + shooter.position.x) / 2, 0, 12),
    y: clamp((keeper.position.y + shooter.position.y) / 2, 0.6, 7.4),
  };
  const players = withController(state.players, undefined);
  return {
    ...state,
    players,
    ballState: {
      type: "loose",
      location: reboundLocation,
      source: "save",
      lastTouchSide: otherSide(intent.side),
      age: 0,
    },
    ball: reboundLocation,
    carrierId: undefined,
    pressure: pressurePlayers({ ...state, players }, undefined),
    event: `${otherSide(intent.side) === "home" ? "Home" : "Away"} keeper spills the save`,
    eventType: "save",
  };
}
