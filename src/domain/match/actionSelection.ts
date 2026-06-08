import type { TeamSide } from "../tactics/types";
import type { TeamDecision } from "../reasoning/types";
import type { MatchSnapshot, PlayerState } from "./types";

function averageX(players: PlayerState[], side: TeamSide): number {
  const group = players.filter((player) => player.side === side);
  return group.reduce((sum, player) => sum + player.position.x, 0) / group.length;
}

export function chooseEvent(
  snapshot: MatchSnapshot,
  decisions: Record<TeamSide, TeamDecision>,
): string {
  const attackingIntent = decisions[snapshot.possession];
  const defendingSide = snapshot.possession === "home" ? "away" : "home";
  const defendingIntent = decisions[defendingSide];
  const lineHeight = averageX(snapshot.players, snapshot.possession);
  const pressureGap =
    (attackingIntent.pressing === "high" ? 1 : attackingIntent.pressing === "medium" ? 0.6 : 0.3) -
    (defendingIntent.pressing === "high" ? 1 : defendingIntent.pressing === "medium" ? 0.6 : 0.3);
  const finalThird = snapshot.ball.x > 8 || snapshot.ball.x < 4;

  if (finalThird && attackingIntent.objective === "finish") {
    return "Chance opens up";
  }

  if (pressureGap < -0.18) {
    return "Turnover under pressure";
  }

  if (attackingIntent.ballAction === "pass" && attackingIntent.supportStyle === "overlap") {
    return "Passing pattern clicks";
  }

  if (lineHeight > 7 || lineHeight < 5) {
    return "Shape stretches";
  }

  return "Battle for space";
}
