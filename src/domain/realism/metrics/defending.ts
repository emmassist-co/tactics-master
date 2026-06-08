import type { MatchTrace } from "../types";

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

function bandScore(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 5;
  const distance = value < min ? min - value : value - max;
  return clampScore(5 - distance / tolerance);
}

export function scoreDefending(trace: MatchTrace) {
  const pressureFrames = trace.events.filter((event) => event.pressureCount > 0).length;
  const turnoverEvents = trace.events.filter((event) => event.eventType === "turnover" || event.eventType === "recovery").length;
  const saveEvents = trace.events.filter((event) => event.eventType === "save").length;
  const blockEvents = trace.events.filter((event) => event.eventType === "block").length;
  const pressureRatio = pressureFrames / Math.max(trace.events.length, 1);
  const turnoverRatio = turnoverEvents / Math.max(trace.events.length, 1);
  const disruptionRatio = (saveEvents + blockEvents) / Math.max(trace.events.length, 1);

  const pressureScore = bandScore(pressureRatio, 0.18, 0.34, 0.08);
  const turnoverScore = bandScore(turnoverRatio, 0.06, 0.18, 0.06);
  const saveScore = bandScore(disruptionRatio, 0.02, 0.1, 0.04);
  const raw = pressureScore * 0.45 + turnoverScore * 0.35 + saveScore * 0.2;

  return {
    score: clampScore(raw),
    summary:
      pressureRatio < 0.14 || turnoverRatio > 0.24
        ? "Defending either affects too few moments or creates too many artificial swings."
        : "Defending shows pressure, recoveries, and shot disruption in a plausible amount.",
    metrics: {
      pressureFrames,
      turnoverEvents,
      saveEvents,
      blockEvents,
      pressureRatio: Number(pressureRatio.toFixed(2)),
      turnoverRatio: Number(turnoverRatio.toFixed(2)),
    },
  };
}
