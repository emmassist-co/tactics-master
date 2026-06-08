import { describe, expect, it } from "vitest";
import { normalizeTeamDecision } from "../teamDecisionSchema";

describe("normalizeTeamDecision", () => {
  it("normalizes invalid output into bounded decisions", () => {
    const decision = normalizeTeamDecision(
      { objective: "wild" as never, eventLabel: "" },
      "home",
      "transition",
    );

    expect(decision.objective).toBe("counter");
    expect(decision.ballAction).toBe("pass");
    expect(decision.likelyActorRole).toBe("link");
  });
});
