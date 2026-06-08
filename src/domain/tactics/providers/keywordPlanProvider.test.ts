import { describe, expect, it } from "vitest";
import { keywordPlanProvider } from "./keywordPlanProvider";

describe("keywordPlanProvider", () => {
  it("produces a tactical plan from free-form input", () => {
    const plan = keywordPlanProvider("home", "Stay compact, press early, and combine quickly");
    expect(plan.shapeFocus).toBe("compact");
    expect(plan.priorities.length).toBeGreaterThan(0);
  });

  it("stays playable for vague prompts", () => {
    const plan = keywordPlanProvider("away", "");
    expect(plan.mentality).toBe("balanced");
    expect(plan.summary).toContain("balanced");
  });
});
