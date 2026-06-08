import type { MatchSnapshot } from "../match/types";
import type { TeamDecisionWindow } from "./types";
import type { TeamSide } from "../tactics/types";

export function classifyDecisionWindow(
  snapshot: MatchSnapshot,
  side: TeamSide,
  lastPossession?: TeamSide,
): TeamDecisionWindow {
  if (snapshot.tick === 0) return "kickoff";
  if (snapshot.event?.includes("Second half")) return "halftime-reset";
  if (lastPossession && lastPossession !== snapshot.possession) return "transition";

  const attacking = snapshot.possession === side;
  const ballX = side === "home" ? snapshot.ball.x : 12 - snapshot.ball.x;

  if (attacking && ballX > 6.4) return "final-third";
  if (!attacking && ballX > 6.5) return "under-pressure";
  return "build-up";
}
