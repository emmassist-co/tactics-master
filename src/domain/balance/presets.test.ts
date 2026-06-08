import { describe, expect, it } from "vitest";
import { TACTICAL_PRESETS } from "./presets";

describe("TACTICAL_PRESETS", () => {
  it("contains distinct tactical shapes for acceptance checks", () => {
    expect(TACTICAL_PRESETS.compactPress.bias.compactness).toBeGreaterThan(
      TACTICAL_PRESETS.directCounter.bias.compactness,
    );
    expect(TACTICAL_PRESETS.combinationPlay.bias.passingBias).toBeGreaterThan(
      TACTICAL_PRESETS.cautiousBlock.bias.passingBias,
    );
  });
});
