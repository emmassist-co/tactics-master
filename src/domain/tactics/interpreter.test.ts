import { describe, expect, it } from "vitest";
import { interpretPrompt } from "./interpreter";

describe("interpretPrompt", () => {
  it("leans compact and pressing for shape-focused prompts", () => {
    const intent = interpretPrompt("Stay compact, press early, and keep our shape");
    expect(intent.compactness).toBeGreaterThan(0.6);
    expect(intent.pressing).toBeGreaterThan(0.6);
    expect(intent.summary).toContain("compact");
  });

  it("leans into combination play for passing prompts", () => {
    const intent = interpretPrompt("Quick passing triangles and overlap when we get wide");
    expect(intent.passingBias).toBeGreaterThan(0.6);
    expect(intent.forwardRuns).toBeGreaterThan(0.55);
  });

  it("returns playable defaults for vague prompts", () => {
    const intent = interpretPrompt("");
    expect(intent.summary).toContain("balanced");
    expect(intent.risk).toBeGreaterThan(0.1);
  });
});
