import { describe, expect, it } from "vitest";
import { scoreBrowserArtifacts } from "./browserReview";

describe("scoreBrowserArtifacts", () => {
  it("rewards complete browser evidence more than incomplete runs", () => {
    const complete = scoreBrowserArtifacts({
      started: true,
      reachedLiveField: true,
      reachedHalftime: true,
      reachedResult: true,
      screenshots: ["start.png", "live.png", "result.png"],
      recordingPath: "run.webm",
      notes: [],
    });
    const incomplete = scoreBrowserArtifacts({
      started: false,
      reachedLiveField: false,
      reachedHalftime: false,
      reachedResult: false,
      screenshots: [],
      notes: [],
    });

    expect(complete.score).toBeGreaterThan(incomplete.score);
    expect(incomplete.notes).toContain("Browser review did not launch.");
  });
});

