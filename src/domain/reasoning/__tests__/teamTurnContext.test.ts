import { describe, expect, it } from "vitest";
import { createTeamTurnContext } from "../teamTurnContext";
import { keywordPlanProvider } from "../../tactics/providers/keywordPlanProvider";
import { createTeam } from "../../match/createInitialMatch";

describe("createTeamTurnContext", () => {
  it("builds visible tactical context for the provider", () => {
    const context = createTeamTurnContext(
      {
        tick: 2,
        half: 1,
        players: [...createTeam("home"), ...createTeam("away")],
        ball: { x: 8, y: 4 },
        possession: "home",
        score: { home: 1, away: 0 },
        event: "Chance opens up",
      },
      "home",
      keywordPlanProvider("home", "Stay compact and combine quickly"),
      "final-third",
    );

    expect(context.visibleSummary).toContain("compact");
    expect(context.ballZone).toBe("middle-third");
  });
});
