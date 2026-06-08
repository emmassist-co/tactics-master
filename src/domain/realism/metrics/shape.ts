import type { MatchTrace } from "../types";

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

function bandScore(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 5;
  const distance = value < min ? min - value : value - max;
  return clampScore(5 - distance / tolerance);
}

export function scoreShape(trace: MatchTrace) {
  const homeSpacing = trace.events.map((event) => event.averageTeamSpacing.home);
  const awaySpacing = trace.events.map((event) => event.averageTeamSpacing.away);
  const spacing = trace.events.map(
    (event) => (event.averageTeamSpacing.home + event.averageTeamSpacing.away) / 2,
  );
  const averageSpacing = spacing.reduce((sum, value) => sum + value, 0) / Math.max(spacing.length, 1);
  const averageHomeSpacing = homeSpacing.reduce((sum, value) => sum + value, 0) / Math.max(homeSpacing.length, 1);
  const averageAwaySpacing = awaySpacing.reduce((sum, value) => sum + value, 0) / Math.max(awaySpacing.length, 1);
  const compressedFrames = trace.events.filter(
    (event) => event.averageTeamSpacing.home < 2 || event.averageTeamSpacing.away < 2,
  ).length;
  const compressedRatio = compressedFrames / Math.max(trace.events.length, 1);
  const spacingImbalance = Math.abs(averageHomeSpacing - averageAwaySpacing);

  const spacingScore = bandScore(averageSpacing, 2.5, 3.5, 0.35);
  const floorScore = bandScore(Math.min(averageHomeSpacing, averageAwaySpacing), 2.2, 3.2, 0.25);
  const compressionScore = bandScore(compressedRatio, 0, 0.08, 0.07);
  const balanceScore = bandScore(spacingImbalance, 0, 0.45, 0.18);
  const raw =
    spacingScore * 0.2 +
    floorScore * 0.4 +
    compressionScore * 0.25 +
    balanceScore * 0.15;

  return {
    score: clampScore(raw),
    summary:
      compressedRatio > 0.2 || spacingImbalance > 0.75
        ? "One or both teams compress their spacing too often to read as believable shape."
        : "Off-ball spacing mostly holds and the two teams stay readable as separate units.",
    metrics: {
      averageSpacing: Number(averageSpacing.toFixed(2)),
      averageHomeSpacing: Number(averageHomeSpacing.toFixed(2)),
      averageAwaySpacing: Number(averageAwaySpacing.toFixed(2)),
      compressedRatio: Number(compressedRatio.toFixed(2)),
      spacingImbalance: Number(spacingImbalance.toFixed(2)),
    },
  };
}
