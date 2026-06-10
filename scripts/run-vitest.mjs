import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const passthroughArgs = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const vitestName = process.platform === "win32" ? "vitest.cmd" : "vitest";

function findVitestBinary(startDir) {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, "node_modules", ".bin", vitestName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

const vitestBin = findVitestBinary(process.cwd());

if (!vitestBin) {
  console.error("Missing Vitest binary in this worktree or its parent directories");
  process.exit(1);
}

const child = spawn(vitestBin, ["run", ...passthroughArgs], {
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
