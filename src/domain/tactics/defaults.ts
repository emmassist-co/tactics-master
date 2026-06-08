import type { TacticalBias } from "./types";

export const DEFAULT_BIAS: Omit<TacticalBias, "rawPrompt" | "summary"> = {
  compactness: 0.5,
  pressing: 0.5,
  passingBias: 0.5,
  width: 0.5,
  tempo: 0.5,
  forwardRuns: 0.5,
  risk: 0.45,
  shooting: 0.45,
};
