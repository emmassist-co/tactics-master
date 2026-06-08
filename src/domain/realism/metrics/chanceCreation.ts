import type { MatchTrace } from "../types";

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

function bandScore(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 5;
  const distance = value < min ? min - value : value - max;
  return clampScore(5 - distance / tolerance);
}

export function scoreChanceCreation(trace: MatchTrace) {
  const shotLikeEvents = trace.events.filter(
    (event) => event.eventType === "shot" || event.eventType === "block" || event.eventType === "save" || event.eventType === "goal",
  ).length;
  const shotsOnGoalEvents = trace.events.filter((event) => event.eventType === "save" || event.eventType === "goal").length;
  const goals = trace.finalScore.home + trace.finalScore.away;
  const finalThirdMoments = trace.events.filter(
    (event) => event.ball.x > 7.5 || event.ball.x < 4.5,
  ).length;
  const buildUpMoments = trace.events.filter((event) => event.eventType === "build-up" || event.eventType === "pass" || event.eventType === "carry").length;
  const shotRatio = shotLikeEvents / Math.max(trace.events.length, 1);
  const finalThirdRatio = finalThirdMoments / Math.max(trace.events.length, 1);
  const buildUpRatio = buildUpMoments / Math.max(trace.events.length, 1);

  const finalThirdScore = bandScore(finalThirdRatio, 0.18, 0.4, 0.12);
  const shotScore = bandScore(shotRatio, 0.04, 0.11, 0.04);
  const shotsOnGoalScore = bandScore(shotsOnGoalEvents, 1, 4, 1.2);
  const goalScore = bandScore(goals, 1, 3, 1);
  const buildUpScore = bandScore(buildUpRatio, 0.45, 0.8, 0.12);
  const raw =
    finalThirdScore * 0.22 +
    shotScore * 0.24 +
    shotsOnGoalScore * 0.14 +
    goalScore * 0.15 +
    buildUpScore * 0.25;

  return {
    score: clampScore(raw),
    summary:
      shotLikeEvents === 0 || finalThirdRatio < 0.15
        ? "Attacks rarely build into believable danger."
        : "Attacks spend enough time progressing and resolving into danger to feel intentional.",
    metrics: {
      shotLikeEvents,
      goals,
      shotsOnGoalEvents,
      buildUpRatio: Number(buildUpRatio.toFixed(2)),
      finalThirdRatio: Number(finalThirdRatio.toFixed(2)),
      shotRatio: Number(shotRatio.toFixed(2)),
    },
  };
}
