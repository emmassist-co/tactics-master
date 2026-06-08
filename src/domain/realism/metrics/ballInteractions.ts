import type { MatchTrace } from "../types";

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

function bandScore(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 5;
  const distance = value < min ? min - value : value - max;
  return clampScore(5 - distance / tolerance);
}

export function scoreBallInteractions(trace: MatchTrace) {
  const passEvents = trace.events.filter((event) => event.ballStateType === "in-transit").length;
  const controlledEvents = trace.events.filter((event) => event.ballStateType === "controlled").length;
  const looseEvents = trace.events.filter((event) => event.ballStateType === "loose").length;
  const uniqueCarriers = new Set(trace.events.map((event) => event.carrierId).filter(Boolean)).size;
  const consecutiveLooseFrames = trace.events.reduce((count, event, index) => {
    if (index === 0) return count;
    return count + (event.ballStateType === "loose" && trace.events[index - 1].ballStateType === "loose" ? 1 : 0);
  }, 0);
  const transitRatio = passEvents / Math.max(trace.events.length, 1);
  const looseRatio = looseEvents / Math.max(trace.events.length, 1);
  const controlledRatio = controlledEvents / Math.max(trace.events.length, 1);
  const carrierVariety = uniqueCarriers / Math.max(4, Math.min(trace.events.length, 10));

  const transitScore = bandScore(transitRatio, 0.12, 0.26, 0.06);
  const looseScore = bandScore(looseRatio, 0.04, 0.16, 0.05);
  const controlScore = bandScore(controlledRatio, 0.42, 0.7, 0.1);
  const carrierScore = bandScore(carrierVariety, 0.45, 0.8, 0.15);
  const continuityPenalty = Math.max(0, consecutiveLooseFrames - 2) * 0.12;
  const raw =
    transitScore * 0.3 +
    looseScore * 0.2 +
    controlScore * 0.2 +
    carrierScore * 0.3 -
    continuityPenalty;

  return {
    score: clampScore(raw),
    summary:
      transitRatio < 0.1 || uniqueCarriers < 3 || consecutiveLooseFrames > 4
        ? "Ball movement still leans too much on repetitive or messy interactions."
        : "Ball movement changes hands and travels enough to read as coherent mini-football.",
    metrics: {
      passEvents,
      looseEvents,
      uniqueCarriers,
      consecutiveLooseFrames,
      transitRatio: Number(transitRatio.toFixed(2)),
      controlledRatio: Number(controlledRatio.toFixed(2)),
    },
  };
}
