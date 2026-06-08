import { describe, expect, it } from "vitest";
import { createInitialState } from "./initialState";
import { selectIntent } from "./selectIntent";
import { normalizeTeamDecision } from "../reasoning/teamDecisionSchema";

describe("selectIntent", () => {
  it("selects a receiver for controlled possession", () => {
    const state = createInitialState();
    const decision = normalizeTeamDecision(
      {
        objective: "progress",
        ballAction: "pass",
        preferredReceiverRole: "forward",
      },
      "home",
      "build-up",
    );

    const intent = selectIntent(state, "home", decision);

    expect(intent.action).toBe("pass");
    expect(intent.actorId).toBe("home-link");
    expect(intent.targetId).toBe("home-forward");
  });

  it("sends both sides to attack a loose ball", () => {
    const state = {
      ...createInitialState(),
      carrierId: undefined,
      ballState: {
        type: "loose" as const,
        location: { x: 6, y: 4 },
        source: "block" as const,
        lastTouchSide: "home" as const,
        age: 0,
      },
      ball: { x: 6, y: 4 },
    };
    const decision = normalizeTeamDecision(
      {
        objective: "counter",
      },
      "away",
      "transition",
    );

    const intent = selectIntent(state, "away", decision);

    expect(intent.action).toBe("recover");
    expect(intent.actorId.startsWith("away-")).toBe(true);
  });
});

