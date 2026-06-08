import { scoreBrowserArtifacts } from "./browserReview";
import { scoreTrace } from "./scoreTrace";
import type { BrowserArtifactManifest, MatchTrace, RealismReport } from "./types";

export function createRealismReport(trace: MatchTrace, browserArtifacts?: BrowserArtifactManifest): RealismReport {
  const traceScore = scoreTrace(trace);
  const browserReview = browserArtifacts ? scoreBrowserArtifacts(browserArtifacts) : undefined;
  const overall = Number(
    (
      traceScore.overall * 0.85 +
      (browserReview ? browserReview.score * 0.15 : traceScore.overall * 0.15)
    ).toFixed(2),
  );

  return {
    trace,
    traceScore,
    browserReview,
    ready: traceScore.ready && overall >= 4,
    overall,
  };
}

export function formatRealismReport(report: RealismReport): string {
  const categories = Object.values(report.traceScore.categories)
    .map((category) => `${category.category}: ${category.score}/5`)
    .join("\n");
  const browser = report.browserReview
    ? `\nBrowser review: ${report.browserReview.score}/5\nArtifacts: ${report.browserReview.artifacts.screenshots.join(", ")}`
    : "";

  return [
    `Ready: ${report.ready ? "yes" : "no"}`,
    `Overall: ${report.overall}/5`,
    `Trace score: ${report.traceScore.overall}/5`,
    categories,
    browser,
  ]
    .filter(Boolean)
    .join("\n");
}

