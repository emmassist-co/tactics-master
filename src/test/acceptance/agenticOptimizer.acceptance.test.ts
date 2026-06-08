import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error script helper is runtime-tested via Vitest and intentionally imported from scripts/.
import { orchestrateOptimizer } from "../../../scripts/optimizer/orchestrate.mjs";

function runGit(cwd: string, ...args: string[]) {
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function makeTempRepo() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "tactics-master-agentic-"));
  runGit(repoRoot, "init");
  runGit(repoRoot, "config", "user.email", "test@example.com");
  runGit(repoRoot, "config", "user.name", "Test User");
  await mkdir(path.join(repoRoot, "src/domain/match-v2"), { recursive: true });
  await mkdir(path.join(repoRoot, "src/test"), { recursive: true });
  await writeFile(path.join(repoRoot, "src/domain/match-v2/tuning.json"), JSON.stringify({ value: 1 }, null, 2));
  await writeFile(path.join(repoRoot, "src/test/locked.test.ts"), "locked\n");
  runGit(repoRoot, "add", ".");
  runGit(repoRoot, "commit", "-m", "init");
  return repoRoot;
}

describe("agentic optimizer orchestration", () => {
  it("promotes a valid improving attempt and rejects protected-file tampering", async () => {
    const repoRoot = await makeTempRepo();
    const baselineReportPath = path.join(repoRoot, "baseline.json");
    const historyPath = path.join(repoRoot, "history.json");

    await writeFile(
      baselineReportPath,
      JSON.stringify({
        averageOverall: 3.3,
        readyCount: 0,
        categoryAverages: {
          offBallShape: 2.28,
          ballInteractions: 3.41,
          defending: 3.48,
          chanceCreation: 4.26,
        },
      }),
    );

    let callCount = 0;

    const result = await orchestrateOptimizer({
      repoRoot,
      baselineReportPath,
      historyPath,
      maxAttempts: 2,
      executor: async ({ worktreePath }: { worktreePath: string }) => {
        callCount += 1;
        if (callCount === 1) {
          await writeFile(path.join(worktreePath, "src/test/locked.test.ts"), "tampered\n");
          return { exitCode: 0, stdout: "tampered" };
        }

        await writeFile(path.join(worktreePath, "src/domain/match-v2/tuning.json"), JSON.stringify({ value: 2 }, null, 2));
        return { exitCode: 0, stdout: "improved" };
      },
      runner: async (cwd: string, command: string, args: string[]) => {
        if (command === "node" && args[0] === "scripts/run-coach-matchups.mjs") {
          const outArg = args.find((item) => item.startsWith("--out="));
          const outPath = outArg?.slice("--out=".length);
          if (!outPath) {
            throw new Error("Missing matchup suite output path");
          }
          const improved = cwd.includes("attempt-2");
          await writeFile(
            outPath,
            JSON.stringify(
              improved
                ? {
                    averageOverall: 3.6,
                    readyCount: 1,
                    categoryAverages: {
                      offBallShape: 2.7,
                      ballInteractions: 3.35,
                      defending: 3.78,
                      chanceCreation: 4.3,
                    },
                  }
                : {
                    averageOverall: 3.3,
                    readyCount: 0,
                    categoryAverages: {
                      offBallShape: 2.28,
                      ballInteractions: 3.41,
                      defending: 3.48,
                      chanceCreation: 4.26,
                    },
                  },
              null,
              2,
            ),
          );
          return;
        }
      },
    });

    expect(result.history.attempts).toHaveLength(2);
    expect(result.history.attempts[0].valid).toBe(false);
    expect(result.history.attempts[1].win).toBe(true);
    expect(result.history.promotedAttemptId).toBe("attempt-2");

    const transplanted = JSON.parse(await readFile(path.join(repoRoot, "src/domain/match-v2/tuning.json"), "utf8"));
    expect(transplanted.value).toBe(2);

    const history = JSON.parse(await readFile(historyPath, "utf8"));
    expect(history.promotedAttemptId).toBe("attempt-2");
  });
});
