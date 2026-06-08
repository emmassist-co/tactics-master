import { loadAttemptPolicy } from "./attempt-policy.mjs";

export function buildAttemptPrompt({
  baselineReport,
  weakestCategories,
  attemptId,
  activePolicy = loadAttemptPolicy(),
}) {
  const weakest = weakestCategories.join(", ");
  return [
    `You are improving the football simulation for attempt ${attemptId}.`,
    "",
    "Rules:",
    "- You may only change simulation-side code.",
    "- You must not modify tests, realism evaluators, docs, UI, or optimizer scripts.",
    "- Do not create commits.",
    "- Stop after implementation and local verification.",
    "",
    "Mutable path prefixes:",
    ...activePolicy.mutablePrefixes.map((item) => `- ${item}`),
    ...activePolicy.mutableFiles.map((item) => `- ${item}`),
    "",
    "Protected path prefixes:",
    ...activePolicy.protectedPrefixes.map((item) => `- ${item}`),
    "",
    "Current baseline:",
    `- average overall: ${baselineReport.averageOverall}/5`,
    `- ready count: ${baselineReport.readyCount}`,
    `- weakest categories: ${weakest}`,
    "",
    "Current category averages:",
    ...Object.entries(baselineReport.categoryAverages).map(([key, value]) => `- ${key}: ${value}/5`),
    "",
    "Verification you must run before stopping:",
    "- pnpm test",
    "- pnpm build",
    "- node scripts/run-coach-matchups.mjs",
    "",
    "Goal:",
    "Improve the aggregate football realism without changing the benchmark surface. It is acceptable if one category regresses slightly, but the overall result should improve in a meaningful way.",
  ].join("\n");
}
