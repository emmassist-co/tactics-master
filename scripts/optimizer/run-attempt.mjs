import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAttemptPrompt } from "./build-attempt-prompt.mjs";
import { loadAttemptPolicy, validateAttemptFiles } from "./attempt-policy.mjs";
import { listChangedFiles } from "./worktree.mjs";

export function executeCodexAttempt({
  worktreePath,
  prompt,
  outputPath,
}) {
  const stdout = execFileSync(
    "codex",
    [
      "exec",
      "-C",
      worktreePath,
      "--sandbox",
      "workspace-write",
      "-o",
      outputPath,
      prompt,
    ],
    {
      cwd: worktreePath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return {
    exitCode: 0,
    stdout,
  };
}

export async function runAttempt({
  repoRoot,
  attempt,
  baselineReport,
  executor = executeCodexAttempt,
  activePolicy = loadAttemptPolicy(),
}) {
  const weakestCategories = Object.entries(baselineReport.categoryAverages)
    .sort((left, right) => left[1] - right[1])
    .slice(0, 2)
    .map(([key]) => key);
  const prompt = buildAttemptPrompt({
    baselineReport,
    weakestCategories,
    attemptId: attempt.attemptId,
    activePolicy,
  });
  const outputPath = path.join(attempt.worktreePath, ".optimizer-attempt-output.txt");
  await writeFile(outputPath, "", "utf8");

  let execution;
  try {
    execution = await executor({
      repoRoot,
      worktreePath: attempt.worktreePath,
      prompt,
      outputPath,
    });
  } catch (error) {
    return {
      attemptId: attempt.attemptId,
      prompt,
      changedFiles: [],
      invalidFiles: [],
      valid: false,
      exitCode: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const changedFiles = listChangedFiles(attempt.worktreePath);
  const validation = validateAttemptFiles(changedFiles, activePolicy);

  return {
    attemptId: attempt.attemptId,
    prompt,
    changedFiles,
    invalidFiles: validation.invalidFiles,
    valid: validation.valid,
    exitCode: execution.exitCode ?? 0,
    outputPath,
    stdout: execution.stdout ?? "",
  };
}
