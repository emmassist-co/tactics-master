import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.split("=");
    return [key, value];
  }),
);

const outPath = args.get("--out") || "/private/tmp/tactics-master-coach-matchups.json";

execFileSync(
  "pnpm",
  ["vitest", "run", "src/test/acceptance/coachMatchups.acceptance.test.ts"],
  {
    encoding: "utf8",
    stdio: "inherit",
    env: {
      ...process.env,
      COACH_MATCHUPS_REPORT_PATH: outPath,
    },
  },
);

const payload = JSON.parse(await readFile(outPath, "utf8"));

console.log(`coach matchup suite: ${payload.readyCount}/${payload.results.length} ready`);
console.log(`average overall: ${payload.averageOverall}/5`);
for (const result of payload.results) {
  console.log(
    `${result.matchupId}: ${result.homeCoach} vs ${result.awayCoach} -> ${result.winner} ${result.finalScore.home}-${result.finalScore.away} overall ${result.overall}/5 shots-on-goal ${result.shotsOnGoalEvents}`,
  );
}
console.log(outPath);
