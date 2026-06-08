import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeHistory(reportPath, payload) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function summarizeAttempt(attemptResult, evaluation, comparison) {
  return {
    attemptId: attemptResult.attemptId,
    valid: attemptResult.valid,
    changedFiles: attemptResult.changedFiles,
    invalidFiles: attemptResult.invalidFiles,
    evaluationOk: evaluation.ok,
    averageOverall: evaluation.matchupReport?.averageOverall ?? null,
    readyCount: evaluation.matchupReport?.readyCount ?? null,
    aggregateDelta: comparison?.aggregateDelta ?? null,
    win: comparison?.win ?? false,
    regressedCategories: comparison?.regressedCategories ?? [],
  };
}
