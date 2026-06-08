import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

function runGit(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function assertGitRepo(repoRoot) {
  try {
    runGit(repoRoot, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new Error(`Not a git repository: ${repoRoot}`);
  }
}

export function currentRef(repoRoot) {
  try {
    return runGit(repoRoot, ["branch", "--show-current"]) || runGit(repoRoot, ["rev-parse", "HEAD"]);
  } catch {
    throw new Error("Unable to determine current git ref for optimizer baseline.");
  }
}

export async function createAttemptWorktree({
  repoRoot,
  attemptId,
  baseRef = currentRef(repoRoot),
  worktreeRoot = path.join(repoRoot, ".optimizer-worktrees"),
}) {
  assertGitRepo(repoRoot);
  await mkdir(worktreeRoot, { recursive: true });
  const branchName = `optimizer/${attemptId}`;
  const worktreePath = path.join(worktreeRoot, attemptId);

  runGit(repoRoot, ["worktree", "add", "-b", branchName, worktreePath, baseRef]);

  return {
    attemptId,
    branchName,
    baseRef,
    worktreePath,
  };
}

export function listChangedFiles(worktreePath) {
  const output = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    cwd: worktreePath,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  return output ? output.split("\n").map((line) => line.trim()).filter(Boolean) : [];
}

export function cleanupAttemptWorktree(repoRoot, attempt) {
  try {
    runGit(repoRoot, ["worktree", "unlock", attempt.worktreePath]);
  } catch {
    // Unlock is best-effort.
  }
  runGit(repoRoot, ["worktree", "remove", "--force", attempt.worktreePath]);
  runGit(repoRoot, ["branch", "-D", attempt.branchName]);
}
