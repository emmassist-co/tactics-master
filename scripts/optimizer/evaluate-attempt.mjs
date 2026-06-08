import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

function runCommand(cwd, command, args, env = {}) {
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...env,
    },
  });
}

export async function evaluateAttempt({
  repoRoot,
  worktreePath,
  reportPath = path.join(worktreePath, ".optimizer-coach-matchups.json"),
  runner = runCommand,
}) {
  try {
    await runner(worktreePath, "pnpm", ["test"]);
    await runner(worktreePath, "pnpm", ["build"]);
    await runner(worktreePath, "node", ["scripts/run-coach-matchups.mjs", `--out=${reportPath}`]);
    const matchupReport = JSON.parse(await readFile(reportPath, "utf8"));
    return {
      ok: true,
      reportPath,
      matchupReport,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      reportPath,
    };
  }
}
