import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = ""] = arg.split("=");
  return [key, value];
}));

const outDir = args.get("--out-dir") || path.join(os.tmpdir(), "tactics-master-realism");
const url = args.get("--url");
const reportPath = path.join(outDir, "trace-report.json");

await fs.mkdir(outDir, { recursive: true });

function runPnpm(args) {
  try {
    execFileSync("pnpm", args, {
      cwd: process.cwd(),
      env: { ...process.env, REALISM_REPORT_PATH: reportPath },
      stdio: "inherit",
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    execFileSync("corepack", ["pnpm", ...args], {
      cwd: process.cwd(),
      env: { ...process.env, REALISM_REPORT_PATH: reportPath },
      stdio: "inherit",
    });
  }
}

runPnpm(["vitest", "run", "src/test/acceptance/realismLoop.acceptance.test.ts"]);

let browserReviewPath = null;
if (url) {
  browserReviewPath = execFileSync(
    "node",
    ["scripts/run-realism-browser-check.mjs", `--url=${url}`, `--out-dir=${outDir}`],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  ).trim();
}

const traceReport = JSON.parse(await fs.readFile(reportPath, "utf8"));
const browserReview = browserReviewPath ? JSON.parse(await fs.readFile(browserReviewPath, "utf8")) : null;

const summary = {
  ready: traceReport.ready,
  overall: traceReport.overall,
  categories: Object.fromEntries(Object.entries(traceReport.traceScore.categories).map(([key, value]) => [key, value.score])),
  failedCategories: traceReport.traceScore.failedCategories,
  browserReview,
  reportPath,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ready) {
  process.exitCode = 1;
}

