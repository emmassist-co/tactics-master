import { execFileSync } from "node:child_process";
import { loadAttemptPolicy, isMutablePath } from "./attempt-policy.mjs";

function runGit(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function buildFilteredPatch({
  worktreePath,
  changedFiles,
  activePolicy = loadAttemptPolicy(),
}) {
  const allowedFiles = changedFiles.filter((filePath) => isMutablePath(filePath, activePolicy));
  if (allowedFiles.length === 0) {
    return {
      allowedFiles,
      patch: "",
    };
  }

  const patch = runGit(worktreePath, ["diff", "--binary", "HEAD", "--", ...allowedFiles]);
  return {
    allowedFiles,
    patch,
  };
}

export function applyPatchTransplant({
  repoRoot,
  patch,
}) {
  if (!patch.trim()) {
    return { applied: false };
  }

  execFileSync("git", ["apply", "--whitespace=nowarn", "-"], {
    cwd: repoRoot,
    input: patch,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  return { applied: true };
}
