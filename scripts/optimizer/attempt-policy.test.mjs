import { describe, expect, it } from "vitest";
import { isMutablePath, isProtectedPath, validateAttemptFiles } from "./attempt-policy.mjs";

describe("attempt policy", () => {
  it("allows simulation-side files and blocks tests and evaluator surfaces", () => {
    expect(isMutablePath("src/domain/match-v2/simulateTick.ts")).toBe(true);
    expect(isMutablePath("src/domain/reasoning/teamTurnContext.ts")).toBe(true);
    expect(isProtectedPath("src/test/acceptance/coachMatchups.acceptance.test.ts")).toBe(true);
    expect(isMutablePath("src/test/acceptance/coachMatchups.acceptance.test.ts")).toBe(false);
    expect(isMutablePath("scripts/run-coach-matchups.mjs")).toBe(false);
  });

  it("reports invalid files from an attempt", () => {
    const result = validateAttemptFiles([
      "src/domain/match-v2/resolvePass.ts",
      "src/test/acceptance/coachMatchups.acceptance.test.ts",
    ]);

    expect(result.valid).toBe(false);
    expect(result.invalidFiles).toEqual(["src/test/acceptance/coachMatchups.acceptance.test.ts"]);
  });
});
