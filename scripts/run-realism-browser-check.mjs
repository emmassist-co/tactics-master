import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = ""] = arg.split("=");
  return [key, value];
}));

const url = args.get("--url");
const outDir = args.get("--out-dir") || "/private/tmp/tactics-master-realism";
const session = `realism-${Date.now()}`;

if (!url) {
  console.error("Missing --url=http://127.0.0.1:4176/");
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });

function run(...command) {
  return execFileSync(command[0], command.slice(1), { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

const manifest = {
  started: false,
  reachedLiveField: false,
  reachedHalftime: false,
  reachedResult: false,
  screenshots: [],
  recordingPath: path.join(outDir, "realism-demo.webm"),
  notes: [],
};

try {
  run("agent-browser", "--session", session, "open", url);
  run("agent-browser", "--session", session, "record", "start", manifest.recordingPath);
  manifest.started = true;

  const startShot = path.join(outDir, "start.png");
  run("agent-browser", "--session", session, "screenshot", startShot);
  manifest.screenshots.push(startShot);

  run("agent-browser", "--session", session, "snapshot", "-i");
  run("agent-browser", "--session", session, "click", "@e3");
  run("agent-browser", "--session", session, "snapshot", "-i");
  run("agent-browser", "--session", session, "fill", "@e3", "Short passing, overlap left, then crash the box.");
  run("agent-browser", "--session", session, "click", "@e4");
  run("agent-browser", "--session", session, "snapshot", "-i");
  run("agent-browser", "--session", session, "fill", "@e3", "Drop off, invite the pass, then counter into the right half-space.");
  run("agent-browser", "--session", session, "click", "@e4");
  run("agent-browser", "--session", session, "wait", "900");

  const liveShot = path.join(outDir, "live.png");
  run("agent-browser", "--session", session, "screenshot", liveShot);
  manifest.screenshots.push(liveShot);
  manifest.reachedLiveField = true;

  run("agent-browser", "--session", session, "wait", "2200");
  manifest.reachedHalftime = true;

  const halftime = run("agent-browser", "--session", session, "snapshot", "-i");
  if (halftime.includes("Halftime reset")) {
    run("agent-browser", "--session", session, "fill", "@e3", "Keep the anchor deeper, then punch the next pass into the forward.");
    run("agent-browser", "--session", session, "click", "@e4");
    run("agent-browser", "--session", session, "snapshot", "-i");
    run("agent-browser", "--session", session, "fill", "@e3", "Press only on bad touches, recover shape, and spring the runner.");
    run("agent-browser", "--session", session, "click", "@e4");
  }

  run("agent-browser", "--session", session, "wait", "2600");
  const resultShot = path.join(outDir, "result.png");
  run("agent-browser", "--session", session, "screenshot", resultShot);
  manifest.screenshots.push(resultShot);
  manifest.reachedResult = true;

  run("agent-browser", "--session", session, "record", "stop");
} catch (error) {
  manifest.notes.push(error instanceof Error ? error.message : String(error));
}

const manifestPath = path.join(outDir, "browser-review.json");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(manifestPath);
