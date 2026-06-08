import { describe, expect, it } from "vitest";
import { createTeam } from "../createInitialMatch";
import { chooseEvent } from "../actionSelection";
import { fallbackTeamTurnProvider } from "../../reasoning/providers/fallbackTeamTurnProvider";
import { createTeamTurnContext } from "../../reasoning/teamTurnContext";
import { keywordPlanProvider } from "../../tactics/providers/keywordPlanProvider";

describe("chooseEvent", () => {
  it("recognizes combination play patterns", async () => {
    const snapshot = {
      tick: 3,
      half: 1 as const,
      players: [...createTeam("home"), ...createTeam("away")],
      ball: { x: 7, y: 4 },
      possession: "home" as const,
      score: { home: 0, away: 0 },
    };
    const event = chooseEvent(snapshot, {
      home: await fallbackTeamTurnProvider.decide(
        createTeamTurnContext(
          snapshot,
          "home",
          keywordPlanProvider("home", "Quick passing triangles and overlap"),
          "build-up",
        ),
      ),
      away: await fallbackTeamTurnProvider.decide(
        createTeamTurnContext(
          snapshot,
          "away",
          keywordPlanProvider("away", "Sit deep and protect"),
          "build-up",
        ),
      ),
    });

    expect(event).toBeTypeOf("string");
  });
});
