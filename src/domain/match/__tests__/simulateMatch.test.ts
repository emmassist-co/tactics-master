import { describe, expect, it } from "vitest";
import { simulateMatchAsync } from "../simulateMatch";
import { keywordPlanProvider } from "../../tactics/providers/keywordPlanProvider";

describe("simulateMatch", () => {
  it("completes with a result and full frame list", async () => {
    const home = keywordPlanProvider("home", "Stay compact and press");
    const away = keywordPlanProvider("away", "Quick passing and forward runs");
    const result = await simulateMatchAsync({
      openingPlans: {
        home,
        away,
      },
      halftimePlans: {
        home: keywordPlanProvider("home", "Protect the middle and stay patient"),
        away: keywordPlanProvider("away", "Counter quickly and shoot early"),
      },
    });

    expect(result.frames.length).toBeGreaterThan(20);
    expect(["home", "away", "draw"]).toContain(result.winner);
    expect(result.frames.some((frame) => frame.ballState?.type === "controlled")).toBe(true);
    expect(result.frames.some((frame) => (frame.pressure?.length ?? 0) > 0 || frame.ballState?.type === "loose")).toBe(true);
  });

  it("changes second-half plan summaries when halftime prompts differ", async () => {
    const result = await simulateMatchAsync({
      openingPlans: {
        home: keywordPlanProvider("home", "Stay compact"),
        away: keywordPlanProvider("away", "Go wide"),
      },
      halftimePlans: {
        home: keywordPlanProvider("home", "Counter faster"),
        away: keywordPlanProvider("away", "Press tighter"),
      },
    });

    expect(result.halftimePlans.home.summary).not.toEqual(result.openingPlans.home.summary);
  });
});
