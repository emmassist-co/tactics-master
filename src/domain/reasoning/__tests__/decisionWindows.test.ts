import { describe, expect, it } from "vitest";
import { classifyDecisionWindow } from "../decisionWindows";
import { createTeam } from "../../match/createInitialMatch";

describe("classifyDecisionWindow", () => {
  it("detects kickoff and final-third windows", () => {
    const base = {
      tick: 0,
      half: 1 as const,
      players: [...createTeam("home"), ...createTeam("away")],
      ball: { x: 6, y: 4 },
      possession: "home" as const,
      score: { home: 0, away: 0 },
      event: "Kick-off",
    };
    expect(classifyDecisionWindow(base, "home")).toBe("kickoff");
    expect(
      classifyDecisionWindow({ ...base, tick: 3, ball: { x: 10, y: 4 } }, "home"),
    ).toBe("final-third");
  });
});
