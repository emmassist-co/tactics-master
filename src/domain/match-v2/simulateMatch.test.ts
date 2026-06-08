import { describe, expect, it } from "vitest";
import { simulateMatchV2Async } from "./simulateMatch";
import { keywordPlanProvider } from "../tactics/providers/keywordPlanProvider";

describe("simulateMatchV2Async", () => {
  it("produces explicit ball states and readable football events", async () => {
    const result = await simulateMatchV2Async({
      openingPlans: {
        home: keywordPlanProvider("home", "Stay compact and pass into the forward quickly"),
        away: keywordPlanProvider("away", "Press the carrier and counter into space"),
      },
      halftimePlans: {
        home: keywordPlanProvider("home", "Push runners higher and shoot sooner"),
        away: keywordPlanProvider("away", "Sit tighter and break after interceptions"),
      },
    });

    expect(result.frames.length).toBeGreaterThan(30);
    expect(result.frames.some((frame) => frame.ballState?.type === "in-transit")).toBe(true);
    expect(result.frames.some((frame) => frame.ballState?.type === "loose")).toBe(true);
    expect(result.frames.some((frame) => frame.eventType === "goal" || frame.eventType === "save")).toBe(true);
  });
});

