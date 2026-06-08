import { execFileSync } from "node:child_process";
import { orchestrateOptimizer } from "./optimizer/orchestrate.mjs";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.split("=");
    return [key, value];
  }),
);

const baselineReportPath = args.get("--baseline-out") || "/private/tmp/tactics-master-coach-matchups.json";
const historyPath = args.get("--history-out") || "/private/tmp/tactics-master-agentic-optimizer.json";
const maxAttempts = Number(args.get("--attempts") || "3");
const keepFailedWorktrees = args.has("--keep-failed-worktrees");
const dryRun = args.has("--dry-run");

execFileSync("node", ["scripts/run-coach-matchups.mjs", `--out=${baselineReportPath}`], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "inherit",
});

const result = await orchestrateOptimizer({
  repoRoot: process.cwd(),
  baselineReportPath,
  historyPath,
  maxAttempts,
  keepFailedWorktrees,
  dryRun,
});

const baselineOverall = result.history.baseline.averageOverall;
const promotedAttempt = result.history.attempts.find((attempt) => attempt.attemptId === result.history.promotedAttemptId);
const finalOverall = promotedAttempt?.averageOverall ?? baselineOverall;

console.log(
  `agentic optimizer complete: ${baselineOverall}/5 -> ${finalOverall}/5${result.history.promotedAttemptId ? ` via ${result.history.promotedAttemptId}` : ""}`,
);
console.log(historyPath);
