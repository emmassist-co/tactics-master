import type { MatchSnapshot } from "../match/types";
import type { TacticalPlan, TeamSide } from "../tactics/types";
import type { TeamDecisionWindow, TeamTurnContext } from "./types";

function ballZone(snapshot: MatchSnapshot, side: TeamSide): TeamTurnContext["ballZone"] {
  const relativeX = side === "home" ? snapshot.ball.x : 12 - snapshot.ball.x;
  if (relativeX < 4) return "defensive-third";
  if (relativeX > 8) return "attacking-third";
  return "middle-third";
}

export function createTeamTurnContext(
  snapshot: MatchSnapshot,
  side: TeamSide,
  plan: TacticalPlan,
  window: TeamDecisionWindow,
): TeamTurnContext {
  const scoreDelta =
    side === "home"
      ? snapshot.score.home - snapshot.score.away
      : snapshot.score.away - snapshot.score.home;

  return {
    side,
    window,
    half: snapshot.half,
    scoreDelta,
    plan,
    event: snapshot.event ?? "phase continues",
    possession: snapshot.possession,
    ballZone: ballZone(snapshot, side),
    visibleSummary: `${plan.summary}; ${plan.priorities[0] ?? "stay balanced"}`,
    snapshot,
  };
}
