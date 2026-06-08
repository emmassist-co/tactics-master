import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runAttempt } from "./run-attempt.mjs";

function runGit(cwd, ...args) {
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("runAttempt", () => {
  it("marks attempts invalid when protected files change", async () => {
    const worktreePath = await mkdtemp(path.join(os.tmpdir(), "tactics-master-attempt-"));
    runGit(worktreePath, "init");
    runGit(worktreePath, "config", "user.email", "test@example.com");
    runGit(worktreePath, "config", "user.name", "Test User");
    await mkdir(path.join(worktreePath, "src/test"), { recursive: true });
    await writeFile(path.join(worktreePath, "src/test/locked.test.ts"), "locked\n", "utf8");
    runGit(worktreePath, "add", ".");
    runGit(worktreePath, "commit", "-m", "init");

    const result = await runAttempt({
      repoRoot: worktreePath,
      attempt: {
        attemptId: "attempt-1",
        worktreePath,
      },
      baselineReport: {
        averageOverall: 3.3,
        readyCount: 0,
        categoryAverages: {
          offBallShape: 2.28,
          ballInteractions: 3.41,
          defending: 3.48,
          chanceCreation: 4.26,
        },
      },
      executor: async () => ({ exitCode: 0, stdout: "" }),
    });

    expect(result.valid).toBe(true);

    await writeFile(path.join(worktreePath, "src/test/locked.test.ts"), "tampered\n", "utf8");

    const invalid = await runAttempt({
      repoRoot: worktreePath,
      attempt: {
        attemptId: "attempt-2",
        worktreePath,
      },
      baselineReport: {
        averageOverall: 3.3,
        readyCount: 0,
        categoryAverages: {
          offBallShape: 2.28,
          ballInteractions: 3.41,
          defending: 3.48,
          chanceCreation: 4.26,
        },
      },
      executor: async () => ({ exitCode: 0, stdout: "" }),
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.invalidFiles).toEqual(["src/test/locked.test.ts"]);
  });
});
