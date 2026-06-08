import { describe, expect, it } from "vitest";
import { aiTeamTurnProvider } from "../providers/aiTeamTurnProvider";
import { keywordPlanProvider } from "../../tactics/providers/keywordPlanProvider";
import { createTeamTurnContext } from "../teamTurnContext";
import { createTeam } from "../../match/createInitialMatch";

describe("aiTeamTurnProvider", () => {
  it("falls back cleanly when no live model is configured", async () => {
    const decision = await aiTeamTurnProvider.decide(
      createTeamTurnContext(
        {
          tick: 3,
          half: 1,
          players: [...createTeam("home"), ...createTeam("away")],
          ball: { x: 9, y: 4 },
          possession: "home",
          score: { home: 0, away: 0 },
          event: "Chance opens up",
        },
        "home",
        keywordPlanProvider("home", "Counter fast and attack the box"),
        "final-third",
      ),
    );

    expect(decision.window).toBe("final-third");
    expect(decision.eventLabel.length).toBeGreaterThan(0);
  });
});
