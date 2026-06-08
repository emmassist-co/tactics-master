import type { MatchResult, MatchSnapshot } from "../match/types";
import type { MatchTrace } from "../realism/types";

function pairwiseAverageSpacing(players: MatchSnapshot["players"], side: "home" | "away"): number {
  const team = players.filter((player) => player.side === side);
  if (team.length < 2) return 0;
  const distances: number[] = [];

  for (let index = 0; index < team.length; index += 1) {
    for (let next = index + 1; next < team.length; next += 1) {
      distances.push(
        Math.hypot(
          team[index].position.x - team[next].position.x,
          team[index].position.y - team[next].position.y,
        ),
      );
    }
  }

  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}

export function createMatchTrace(result: MatchResult): MatchTrace {
  return {
    totalFrames: result.frames.length,
    finalScore: result.finalScore,
    events: result.frames.map((frame) => ({
      tick: frame.tick,
      half: frame.half,
      event: frame.event ?? "No event",
      eventType: frame.eventType ?? "unknown",
      possession: frame.possession,
      carrierId: frame.carrierId,
      ballStateType: frame.ballState?.type ?? "unknown",
      pressureCount: frame.pressure?.length ?? 0,
      ball: frame.ball,
      score: frame.score,
      averageTeamSpacing: {
        home: pairwiseAverageSpacing(frame.players, "home"),
        away: pairwiseAverageSpacing(frame.players, "away"),
      },
    })),
  };
}

