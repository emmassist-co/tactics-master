import path from "node:path";
import { readFile } from "node:fs/promises";
import { loadAttemptPolicy } from "./attempt-policy.mjs";
import { createAttemptWorktree, cleanupAttemptWorktree, assertGitRepo } from "./worktree.mjs";
import { runAttempt } from "./run-attempt.mjs";
import { evaluateAttempt } from "./evaluate-attempt.mjs";
import { compareAttempt } from "./score-attempt.mjs";
import { buildFilteredPatch, applyPatchTransplant } from "./transplant-patch.mjs";
import { summarizeAttempt, writeHistory } from "./history.mjs";

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function orchestrateOptimizer({
  repoRoot,
  baselineReportPath,
  maxAttempts = 3,
  keepFailedWorktrees = false,
  dryRun = false,
  executor,
  runner,
  historyPath = "/private/tmp/tactics-master-agentic-optimizer.json",
}) {
  assertGitRepo(repoRoot);
  const activePolicy = loadAttemptPolicy();
  const baselineReport = await readJson(baselineReportPath);
  const history = {
    baseline: baselineReport,
    attempts: [],
    promotedAttemptId: null,
  };

  let winningAttempt = null;

  for (let index = 1; index <= maxAttempts; index += 1) {
    const attempt = await createAttemptWorktree({
      repoRoot,
      attemptId: `attempt-${index}`,
    });

    const attemptResult = await runAttempt({
      repoRoot,
      attempt,
      baselineReport,
      executor,
      activePolicy,
    });

    let evaluation = { ok: false };
    let comparison = null;

    if (attemptResult.valid && attemptResult.exitCode === 0) {
      evaluation = await evaluateAttempt({
        repoRoot,
        worktreePath: attempt.worktreePath,
        runner,
      });

      if (evaluation.ok) {
        comparison = compareAttempt({
          baselineReport,
          candidateReport: evaluation.matchupReport,
        });
      }
    }

    history.attempts.push(summarizeAttempt(attemptResult, evaluation, comparison));

    if (!dryRun && comparison?.win) {
      const { patch, allowedFiles } = buildFilteredPatch({
        worktreePath: attempt.worktreePath,
        changedFiles: attemptResult.changedFiles,
        activePolicy,
      });
      applyPatchTransplant({
        repoRoot,
        patch,
      });
      winningAttempt = {
        attemptId: attempt.attemptId,
        allowedFiles,
        comparison,
      };
      history.promotedAttemptId = attempt.attemptId;
      cleanupAttemptWorktree(repoRoot, attempt);
      break;
    }

    if (!keepFailedWorktrees) {
      cleanupAttemptWorktree(repoRoot, attempt);
    }
  }

  await writeHistory(historyPath, history);

  return {
    history,
    winningAttempt,
  };
}
