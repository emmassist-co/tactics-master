import { describe, expect, it } from "vitest";
import { simulateMatchV2Async } from "./simulateMatch";
import { createMatchTrace } from "./trace";
import { keywordPlanProvider } from "../tactics/providers/keywordPlanProvider";

describe("createMatchTrace", () => {
  it("exports normalized event data from a simulated match", async () => {
    const result = await simulateMatchV2Async({
      openingPlans: {
        home: keywordPlanProvider("home", "Stay compact and pass early"),
        away: keywordPlanProvider("away", "Counter into the channels"),
      },
      halftimePlans: {
        home: keywordPlanProvider("home", "Keep the anchor deeper"),
        away: keywordPlanProvider("away", "Press bad touches"),
      },
    });

    const trace = createMatchTrace(result);

    expect(trace.totalFrames).toBe(result.frames.length);
    expect(trace.events.length).toBe(result.frames.length);
    expect(trace.events.some((event) => event.ballStateType === "in-transit")).toBe(true);
    expect(trace.events.some((event) => event.ballStateType === "loose")).toBe(true);
  });
});

