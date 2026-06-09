import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.split("=");
    return [key, value];
  }),
);

const outPath = args.get("--out") || path.join(os.tmpdir(), "tactics-master-coach-matchups.json");

function runPnpm(args) {
  try {
    execFileSync("pnpm", args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        COACH_MATCHUPS_REPORT_PATH: outPath,
      },
      stdio: "inherit",
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    execFileSync("corepack", ["pnpm", ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        COACH_MATCHUPS_REPORT_PATH: outPath,
      },
      stdio: "inherit",
    });
  }
}

runPnpm(["vitest", "run", "src/test/acceptance/coachMatchups.acceptance.test.ts"]);

const payload = JSON.parse(await readFile(outPath, "utf8"));
const summary = {
  ready: payload.readyCount === payload.results.length,
  readyCount: payload.readyCount,
  totalMatchups: payload.results.length,
  averageOverall: payload.averageOverall,
  categoryAverages: payload.categoryAverages,
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ready) {
  process.exitCode = 1;
}
