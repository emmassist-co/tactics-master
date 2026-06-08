import { describe, expect, it } from "vitest";
import { simulateMatchAsync } from "../../domain/match/simulateMatch";
import { TACTICAL_PRESETS } from "../../domain/balance/presets";
import { keywordPlanProvider } from "../../domain/tactics/providers/keywordPlanProvider";

describe("tactics duel acceptance", () => {
  it("keeps a full local duel playable even with a vague prompt", async () => {
    const result = await simulateMatchAsync({
      openingPlans: {
        home: TACTICAL_PRESETS.compactPress,
        away: keywordPlanProvider("away", "Do something clever"),
      },
      halftimePlans: {
        home: TACTICAL_PRESETS.combinationPlay,
        away: TACTICAL_PRESETS.directCounter,
      },
    });

    expect(result.frames.length).toBeGreaterThan(30);
    expect(result.frames.some((frame) => frame.ballState?.type === "in-transit")).toBe(true);
    expect(result.frames.some((frame) => frame.ballState?.type === "loose")).toBe(true);
    expect(result.frames.some((frame) => frame.carrierId)).toBe(true);
    expect(result.frames.some((frame) => (frame.pressure?.length ?? 0) > 0)).toBe(true);
    expect(result.halftimePlans.home.summary).toContain("play");
  });
});
