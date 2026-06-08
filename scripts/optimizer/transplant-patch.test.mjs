import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyPatchTransplant, buildFilteredPatch } from "./transplant-patch.mjs";

function run(cwd, ...args) {
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function makeRepo() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "tactics-master-repo-"));
  run(repoRoot, "init");
  run(repoRoot, "config", "user.email", "test@example.com");
  run(repoRoot, "config", "user.name", "Test User");
  await mkdir(path.join(repoRoot, "src/domain/match-v2"), { recursive: true });
  await mkdir(path.join(repoRoot, "src/test"), { recursive: true });
  await writeFile(path.join(repoRoot, "src/domain/match-v2/simulateTick.ts"), "export const value = 1;\n", "utf8");
  await writeFile(path.join(repoRoot, "src/test/blocked.test.ts"), "test\n", "utf8");
  run(repoRoot, "add", ".");
  run(repoRoot, "commit", "-m", "init");
  return repoRoot;
}

describe("transplant patch", () => {
  it("builds a patch only from mutable files", async () => {
    const repoRoot = await makeRepo();
    const worktreePath = await mkdtemp(path.join(os.tmpdir(), "tactics-master-worktree-"));
    run(repoRoot, "worktree", "add", "-b", "attempt", worktreePath, "HEAD");

    await writeFile(path.join(worktreePath, "src/domain/match-v2/simulateTick.ts"), "export const value = 2;\n", "utf8");
    await writeFile(path.join(worktreePath, "src/test/blocked.test.ts"), "changed\n", "utf8");

    const { patch, allowedFiles } = buildFilteredPatch({
      worktreePath,
      changedFiles: [
        "src/domain/match-v2/simulateTick.ts",
        "src/test/blocked.test.ts",
      ],
    });

    expect(allowedFiles).toEqual(["src/domain/match-v2/simulateTick.ts"]);
    expect(patch).toContain("export const value = 2;");
    expect(patch).not.toContain("changed");

    applyPatchTransplant({
      repoRoot,
      patch,
    });

    const contents = await readFile(path.join(repoRoot, "src/domain/match-v2/simulateTick.ts"), "utf8");
    expect(contents).toContain("export const value = 2;");
  });
});
