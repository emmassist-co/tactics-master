import { chooseEvent } from "./actionSelection";
import { resolveBall, stepPlayers } from "./actionResolution";
import type { MatchSnapshot } from "./types";
import type { TacticalPlan, TeamSide } from "../tactics/types";
import type { TeamDecision } from "../reasoning/types";

export function simulateTick(
  snapshot: MatchSnapshot,
  plans: Record<TeamSide, TacticalPlan>,
  decisions: Record<TeamSide, TeamDecision>,
): MatchSnapshot {
  const players = stepPlayers(snapshot.players, snapshot.possession, plans, decisions);
  const ballState = resolveBall(snapshot, plans, decisions);
  const score = { ...snapshot.score };
  let event = chooseEvent(snapshot, decisions);

  if (ballState.goalFor) {
    score[ballState.goalFor] += 1;
    event = `${ballState.goalFor === "home" ? "Home" : "Away"} score`;
  }

  return {
    tick: snapshot.tick + 1,
    half: snapshot.half,
    players: players.map((player) => ({
      ...player,
      hasBall: player.side === ballState.possession && player.role === "link",
    })),
    ball: ballState.ball,
    possession: ballState.possession,
    score,
    event,
    decisions,
  };
}
