import { DEFAULT_BIAS } from "./defaults";
import type { TacticalBias } from "./types";

const CLUSTERS: Array<{ words: string[]; apply: (intent: TacticalBias) => void }> = [
  {
    words: ["compact", "tight", "narrow", "shape", "organized"],
    apply: (intent) => {
      intent.compactness += 0.18;
      intent.width -= 0.12;
    },
  },
  {
    words: ["press", "harass", "aggressive", "hunt", "intercept"],
    apply: (intent) => {
      intent.pressing += 0.2;
      intent.tempo += 0.08;
      intent.risk += 0.05;
    },
  },
  {
    words: ["pass", "triangle", "combination", "one-two", "overlap", "quick"],
    apply: (intent) => {
      intent.passingBias += 0.18;
      intent.forwardRuns += 0.1;
      intent.tempo += 0.1;
    },
  },
  {
    words: ["wide", "wing", "stretch", "touchline"],
    apply: (intent) => {
      intent.width += 0.2;
      intent.compactness -= 0.08;
    },
  },
  {
    words: ["slow", "calm", "patient", "recycle", "keep"],
    apply: (intent) => {
      intent.tempo -= 0.15;
      intent.passingBias += 0.12;
      intent.risk -= 0.08;
    },
  },
  {
    words: ["direct", "fast", "counter", "break", "through"],
    apply: (intent) => {
      intent.tempo += 0.18;
      intent.forwardRuns += 0.18;
      intent.risk += 0.1;
      intent.shooting += 0.05;
    },
  },
  {
    words: ["shoot", "finish", "strike", "goal", "chance"],
    apply: (intent) => {
      intent.shooting += 0.18;
      intent.risk += 0.08;
    },
  },
  {
    words: ["safe", "hold", "deep", "protect", "defend"],
    apply: (intent) => {
      intent.compactness += 0.1;
      intent.pressing -= 0.08;
      intent.risk -= 0.12;
      intent.forwardRuns -= 0.08;
    },
  },
];

function clamp(value: number): number {
  return Math.max(0.1, Math.min(0.9, value));
}

function buildSummary(intent: TacticalBias): string {
  const shape = intent.compactness > 0.62 ? "compact shape" : intent.width > 0.62 ? "wide shape" : "balanced shape";
  const pressure = intent.pressing > 0.62 ? "assertive pressing" : intent.pressing < 0.38 ? "measured defending" : "mid-block pressure";
  const attack = intent.passingBias > 0.6 ? "combination play" : intent.shooting > 0.58 ? "direct finishing" : "mixed attacks";
  return `${shape}, ${pressure}, ${attack}`;
}

export function interpretPrompt(rawPrompt: string): TacticalBias {
  const normalized = rawPrompt.trim().toLowerCase();
  const intent: TacticalBias = {
    ...DEFAULT_BIAS,
    rawPrompt,
    summary: "",
  };

  for (const cluster of CLUSTERS) {
    if (cluster.words.some((word) => normalized.includes(word))) {
      cluster.apply(intent);
    }
  }

  if (normalized.length === 0) {
    intent.summary = "balanced shape, mid-block pressure, mixed attacks";
    return intent;
  }

  if (normalized.includes("not")) {
    intent.risk -= 0.03;
    intent.tempo -= 0.02;
  }

  intent.compactness = clamp(intent.compactness);
  intent.pressing = clamp(intent.pressing);
  intent.passingBias = clamp(intent.passingBias);
  intent.width = clamp(intent.width);
  intent.tempo = clamp(intent.tempo);
  intent.forwardRuns = clamp(intent.forwardRuns);
  intent.risk = clamp(intent.risk);
  intent.shooting = clamp(intent.shooting);
  intent.summary = buildSummary(intent);

  return intent;
}
