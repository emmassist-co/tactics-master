import { describe, expect, it } from "vitest";
import { createInitialState } from "./initialState";
import { simulateTick } from "./simulateTick";
import { normalizeTeamDecision } from "../reasoning/teamDecisionSchema";

function averageSpacing(
  players: Array<{ side: "home" | "away"; position: { x: number; y: number } }>,
  side: "home" | "away",
): number {
  const team = players.filter((player) => player.side === side);
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

describe("simulateTick", () => {
  it("keeps the attacking shape readable when the keeper starts a build-out", () => {
    const state = {
      ...createInitialState(),
      possession: "away" as const,
      carrierId: "away-keeper",
      ballState: {
        type: "controlled" as const,
        playerId: "away-keeper",
        side: "away" as const,
      },
      ball: { x: 10.8, y: 4 },
      players: createInitialState().players.map((player) => ({
        ...player,
        hasBall: player.id === "away-keeper",
      })),
    };

    const next = simulateTick(state, {
      home: normalizeTeamDecision({ objective: "press", pressing: "high" }, "home", "build-up"),
      away: normalizeTeamDecision({ objective: "retain", targetZone: "right" }, "away", "build-up"),
    });

    expect(averageSpacing(next.players, "away")).toBeGreaterThan(2.1);
  });
});
