import type { MatchState } from "./types";
import { distance, pressurePlayers, withController } from "./transition";
import type { MatchSnapshot } from "../match/types";

export function resolveRecovery(state: MatchState): MatchSnapshot {
  if (state.ballState?.type !== "loose") {
    return state;
  }
  const looseBall = state.ballState;

  const nearest = [...state.players]
    .map((player) => ({ player, d: distance(player.position, looseBall.location) }))
    .sort((left, right) => left.d - right.d);
  const winner = nearest[0];
  const challenger = nearest[1];

  if (winner && (!challenger || winner.d + 0.35 < challenger.d || looseBall.age > 0)) {
    const players = withController(state.players, winner.player.id);
    const changedSide = winner.player.side !== looseBall.lastTouchSide;
    return {
      ...state,
      players,
      ballState: {
        type: "controlled",
        playerId: winner.player.id,
        side: winner.player.side,
      },
      ball: winner.player.position,
      carrierId: winner.player.id,
      possession: winner.player.side,
      pressure: pressurePlayers({ ...state, players }, winner.player.id),
      event: changedSide
        ? `${winner.player.side === "home" ? "Home" : "Away"} recover the second ball`
        : `${winner.player.side === "home" ? "Home" : "Away"} settle the loose ball`,
      eventType: changedSide ? "recovery" : "build-up",
    };
  }

  return {
    ...state,
    ballState: {
      ...looseBall,
      age: looseBall.age + 1,
    },
    event: "Loose ball still bouncing",
    eventType: "build-up",
  };
}
