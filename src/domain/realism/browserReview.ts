import type { BrowserArtifactManifest, BrowserReviewSummary } from "./types";

export function scoreBrowserArtifacts(artifacts: BrowserArtifactManifest): BrowserReviewSummary {
  let score = 2;
  const notes = [...artifacts.notes];

  if (artifacts.reachedLiveField) score += 0.7;
  if (artifacts.reachedHalftime) score += 0.4;
  if (artifacts.reachedResult) score += 0.4;
  if (artifacts.screenshots.length >= 3) score += 0.3;
  if (artifacts.recordingPath) score += 0.2;
  if (!artifacts.started) notes.push("Browser review did not launch.");

  return {
    score: Number(Math.max(1, Math.min(5, score)).toFixed(2)),
    summary:
      artifacts.reachedLiveField && artifacts.reachedResult
        ? "Browser run produced enough visual evidence to sanity-check live realism."
        : "Browser evidence is incomplete and should not increase confidence.",
    notes,
    artifacts,
  };
}

