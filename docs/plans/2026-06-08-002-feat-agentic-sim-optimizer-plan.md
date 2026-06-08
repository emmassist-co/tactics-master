---
title: Plan agentic simulation optimizer
type: feat
status: completed
date: 2026-06-08
origin: user request in session after coach matchup suite and local tuning loop
---

# Plan agentic simulation optimizer

## Summary

Replace the current in-process tuning-only optimizer with a delegated improvement loop that gives each attempt its own worktree, asks a Codex worker to improve simulation-side code without touching tests, evaluates the result with the existing test/build and matchup harness, and promotes only metric-improving candidates back into the main checkout as a filtered patch.

This keeps the product aligned with the strategy's `core match engine` and `pacing and drama` tracks while avoiding the main failure mode of self-optimizing loops: cheating by changing the benchmark or destabilizing the primary checkout.

---

## Problem Frame

The repo now has two useful ingredients:

- a stable matchup evaluation surface driven by inspired tactical fixtures
- a local optimizer that can only adjust exposed tuning constants

That loop is useful, but it is too weak for the next realism pass. The current football model's biggest remaining weakness is not just constant selection. It is structural behavior: spacing, pressure response, loose-ball handling, and support movement. Those problems often require code changes in the simulation and reasoning layers, not just parameter edits.

At the same time, letting a single agent rewrite the live checkout in place is too risky. It can accidentally change tests, weaken the evaluator, or leave the working tree in a confusing half-state. The new system therefore needs to isolate each attempt, constrain its authority, score it against a fixed harness, and transplant only the winning diff back.

---

## Requirements Traceability

- The loop must create a fresh worktree per attempt instead of mutating the main checkout directly.
- Each attempt must be executed by a delegated Codex worker, not by the parent process editing files itself.
- Delegated attempts may change simulation-side product code only.
- Delegated attempts may not modify tests.
- Candidates must pass the existing verification surface before being eligible for promotion:
  - `pnpm test`
  - `pnpm build`
  - coach matchup suite
- The acceptance function is `best available win`, not strict monotonic category improvement.
- Winning attempts must come back through patch transplant, not merge or branch adoption.
- The system must guard against benchmark tampering and accidental cross-attempt contamination.

---

## Key Technical Decisions

- KTD1. **Worktree-per-attempt isolation.** Every candidate runs in its own worktree so code changes, dependency state, and artifacts are isolated from the main checkout and from sibling attempts.
- KTD2. **Delegated worker, parent as judge.** The parent orchestrator creates the worktree, defines the allowed surface, launches the Codex worker with a constrained brief, and performs all scoring and promotion decisions itself.
- KTD3. **Simulation-only mutation policy.** Attempts may modify the simulation engine, simulation-adjacent reasoning, and tuning/config that affect football behavior, but not UI, docs, tests, or evaluator logic.
- KTD4. **Fixed evaluation harness.** The loop evaluates candidates against the existing trusted harness, not a worker-modifiable benchmark. Test and evaluator files are treated as immutable inputs to the attempt.
- KTD5. **Best-available win function.** A candidate may win even if one category regresses slightly, as long as aggregate realism improves enough and verification remains green. This matches the user's explicit choice and reflects real football tradeoffs.
- KTD6. **Patch transplant promotion.** Only the filtered diff from allowed files is copied back to the main checkout. The winning worktree branch is not merged, which reduces bleed from attempt-local noise.
- KTD7. **Attempt ledger and reproducibility.** Each attempt must emit a machine-readable record of prompt, changed files, verification status, matchup scores, and promotion decision so later passes can be audited.

---

## High-Level Technical Design

```text
baseline checkout
-> create isolated worktree
-> write delegated attempt brief
-> Codex worker edits allowed files only
-> parent runs fixed verification harness
-> score candidate against baseline
-> if win: build filtered patch
-> transplant patch into main checkout
-> record ledger entry
-> repeat until no better candidate or budget exhausted
```

The key authority split is:

`worker proposes code changes`
`parent verifies`
`parent scores`
`parent decides promotion`

The parent process must remain the only writer to:

- evaluator outputs
- promotion decisions
- main-checkout patch transplant
- attempt history / summary ledger

---

## System-Wide Impact

- `scripts/optimize-match-sim.mjs` will stop being a local tuning-only optimizer and become the parent orchestrator entrypoint or be split into a parent runner plus helper modules.
- A new worktree/attempt layer will be introduced under `scripts/` and likely a small `src/domain/optimizer/` or `src/lib/optimizer/` support surface if shared logic becomes non-trivial.
- The matchup suite and realism harness remain the scoring authority and must be consumed read-only by delegated attempts.
- The repo will need a clear contract for which files are mutable by the worker and which are protected.
- Documentation must teach a human operator how to run the loop, inspect attempts, and recover if a delegated attempt crashes or hangs.

---

## Implementation Units

### U1. Define the attempt contract and mutable surface

- **Goal:** Establish the rules that govern what a delegated attempt is allowed to change and what the parent will evaluate.
- **Requirements:** worktree-per-attempt, delegated worker, simulation-only mutation policy, no test edits.
- **Dependencies:** None.
- **Files:**
  - `docs/plans/2026-06-08-002-feat-agentic-sim-optimizer-plan.md`
  - `README.md`
  - `scripts/optimize-match-sim.mjs`
  - `scripts/optimizer/attempt-policy.json`
  - `scripts/optimizer/attempt-policy.test.mjs`
- **Approach:** Define explicit allowlists and deny lists for paths. The policy should include at least:
  - allowed simulation-side source files
  - protected tests and evaluator files
  - protected UI files
  - protected docs
  - artifact/output paths
  The worker brief should be generated from this policy rather than hand-written separately each time.
- **Patterns to follow:** Reuse the repo's current script-first verification style. Keep the policy machine-readable so both the parent and the attempt validator can consume it.
- **Test scenarios:**
  - A path under the simulation engine is accepted as mutable.
  - A path under `src/test/` is rejected as immutable.
  - A path under evaluator scripts is rejected as immutable.
  - The generated worker brief reflects the same allowed surface as the policy file.
- **Verification:** Policy tests pass and the generated brief matches the allowlist contract.

### U2. Create worktree lifecycle management for attempts

- **Goal:** Create and clean up isolated attempt worktrees predictably.
- **Requirements:** fresh worktree per attempt, no cross-attempt contamination.
- **Dependencies:** U1.
- **Files:**
  - `scripts/optimizer/worktree.mjs`
  - `scripts/optimizer/worktree.test.mjs`
  - `scripts/optimize-match-sim.mjs`
- **Approach:** Add a helper that:
  - derives a unique branch/worktree name per attempt
  - creates the worktree from the current baseline branch
  - records its path and metadata
  - optionally reuses dependency installs safely when possible
  - removes or archives failed worktrees according to policy
  The lifecycle should be deterministic and should fail loudly if a path already exists or the repo is not in a usable state.
- **Patterns to follow:** Follow the user's general preference for clean worktree isolation when the task is substantial. Keep repo-relative artifacts discoverable from the main checkout.
- **Test scenarios:**
  - Creating two attempts generates distinct worktree names and paths.
  - A pre-existing conflicting worktree path fails clearly instead of being reused silently.
  - Cleanup removes only the intended attempt worktree.
  - Metadata persists enough information to reconnect an attempt to its evaluation result.
- **Verification:** Worktree lifecycle tests cover create/conflict/cleanup behavior.

### U3. Build delegated Codex attempt execution

- **Goal:** Launch a Codex worker inside each worktree with a constrained simulation-improvement brief.
- **Requirements:** delegated worker, simulation-only code changes.
- **Dependencies:** U1, U2.
- **Files:**
  - `scripts/optimizer/run-attempt.mjs`
  - `scripts/optimizer/build-attempt-prompt.mjs`
  - `scripts/optimizer/run-attempt.test.mjs`
  - `README.md`
- **Approach:** The parent should generate a prompt that includes:
  - current baseline matchup report
  - current weakest categories
  - mutable path policy
  - explicit prohibition on changing tests/evaluator/UI/docs
  - the expected verification commands to run inside the worktree
  - a requirement to stop after implementation plus local verification
  The execution wrapper should capture exit code, stdout/stderr summary, changed files, and whether the worker violated path policy.
- **Patterns to follow:** Keep the worker contract narrow and explicit. The worker is a proposal engine, not an autonomous release actor.
- **Test scenarios:**
  - The generated worker prompt includes allowed and forbidden surfaces explicitly.
  - An attempt that edits only allowed files is marked valid for evaluation.
  - An attempt that edits protected files is rejected before promotion scoring.
  - Attempt metadata captures changed files and execution result consistently.
- **Verification:** Attempt-runner tests prove prompt shape, file validation, and metadata capture.

### U4. Freeze evaluation and score candidates against baseline

- **Goal:** Evaluate each delegated attempt against a fixed trusted harness and decide whether it is a win.
- **Requirements:** tests/build/matchup suite must pass, best-available win function, benchmark tampering protection.
- **Dependencies:** U1, U3.
- **Files:**
  - `scripts/optimizer/evaluate-attempt.mjs`
  - `scripts/optimizer/score-attempt.mjs`
  - `scripts/optimizer/evaluate-attempt.test.mjs`
  - `scripts/optimizer/score-attempt.test.mjs`
  - `scripts/optimize-match-sim.mjs`
- **Approach:** The parent should run:
  - `pnpm test`
  - `pnpm build`
  - `node scripts/run-coach-matchups.mjs`
  against the worktree. The score function should compare candidate results to the baseline report and apply the `best available win` policy with explicit tolerance rules, for example:
  - must keep tests/build green
  - must improve weighted aggregate score by at least a minimum delta
  - may allow a bounded regression in one category if overall improvement exceeds threshold
  - must reject attempts that improve only by changing protected files
- **Patterns to follow:** Reuse the existing matchup suite and realism report shape rather than inventing a second scoring surface.
- **Test scenarios:**
  - A candidate with failing tests is rejected regardless of matchup score.
  - A candidate with higher overall score and one small category regression can still win.
  - A candidate with trivial or noisy improvement below the minimum delta is rejected.
  - A candidate touching protected files is rejected even if metrics improve.
- **Verification:** Evaluation tests prove gating behavior, and score tests prove the win function.

### U5. Implement filtered patch transplant back to the main checkout

- **Goal:** Promote only the winning simulation diff back into the main repo.
- **Requirements:** patch transplant promotion, no branch merge adoption.
- **Dependencies:** U1, U4.
- **Files:**
  - `scripts/optimizer/transplant-patch.mjs`
  - `scripts/optimizer/transplant-patch.test.mjs`
  - `scripts/optimize-match-sim.mjs`
- **Approach:** Build a promotion step that:
  - computes the diff between baseline and winning worktree
  - filters it to mutable allowed paths only
  - applies that diff to the main checkout
  - re-runs the trusted verification surface in the main checkout after transplant
  If transplant verification fails, promotion must roll back and mark the attempt as non-promotable.
- **Patterns to follow:** Favor filtered patch application over branch merge so the main checkout receives only the intended simulation changes.
- **Test scenarios:**
  - A winning attempt touching only allowed files transplants cleanly.
  - A diff containing disallowed files is filtered or rejected according to policy.
  - A post-transplant verification failure aborts promotion and leaves the main checkout unchanged.
  - The transplanted patch matches the winning worktree behavior on the trusted matchup suite.
- **Verification:** Patch-transplant tests and a post-transplant verification pass in the main checkout.

### U6. Add attempt ledger, reporting, and operator controls

- **Goal:** Make the loop inspectable, repeatable, and safe to operate across multiple attempts.
- **Requirements:** reproducible attempt history, explicit promotion decision, guardrails against silent failure.
- **Dependencies:** U2, U3, U4, U5.
- **Files:**
  - `scripts/optimizer/history.mjs`
  - `scripts/optimizer/format-report.mjs`
  - `scripts/optimize-match-sim.mjs`
  - `README.md`
- **Approach:** Persist a per-run ledger that records:
  - baseline score
  - attempt id and worktree path
  - worker result
  - changed files
  - verification status
  - matchup results
  - promotion decision
  - final winning attempt, if any
  Add operator controls such as max attempts, dry run, keep failed worktrees, and stop-on-first-win vs continue-search.
- **Patterns to follow:** Match the current script-output style, but make the report machine-readable first and human-readable second.
- **Test scenarios:**
  - A run with no winner still emits a complete ledger.
  - A run with a winner records both the attempt evaluation and the transplant confirmation.
  - Dry-run mode evaluates candidates without mutating the main checkout.
  - Operator controls change loop behavior without breaking reporting.
- **Verification:** Ledger/report tests plus manual dry-run inspection of one multi-attempt run.

### U7. Add acceptance coverage for the full orchestration loop

- **Goal:** Prove the parent orchestrator behaves correctly as a system, not just as isolated helpers.
- **Requirements:** delegated worktree attempts, fixed evaluation, patch transplant, benchmark protection.
- **Dependencies:** U1 through U6.
- **Files:**
  - `src/test/acceptance/agenticOptimizer.acceptance.test.ts`
  - `scripts/optimizer/fixtures/`
  - `README.md`
- **Approach:** Create controlled fixtures or fakes for:
  - a valid improving attempt
  - a protected-file violating attempt
  - a green but non-improving attempt
  - a candidate that improves in the worktree but fails after transplant
  The acceptance layer should validate the orchestration decisions without needing a full real Codex invocation in every test.
- **Execution note:** Start with a failing orchestration acceptance test for a simple win path, then add rejection-path fixtures.
- **Patterns to follow:** Mirror the repo's acceptance style: stable harness, machine-readable artifacts, and explicit pass/fail semantics.
- **Test scenarios:**
  - A valid improving attempt is promoted through filtered patch transplant.
  - A protected-file attempt is rejected before score comparison.
  - A non-improving attempt leaves the main checkout untouched.
  - A transplant failure aborts promotion and records the failure in the ledger.
- **Verification:** Acceptance suite passes and the fixtures prove each major orchestration branch.

---

## Sequencing

1. U1 defines the path policy and mutation contract.
2. U2 creates safe worktree lifecycle management.
3. U3 adds delegated worker execution under that contract.
4. U4 turns candidate output into a trustworthy pass/fail and win/loss decision.
5. U5 promotes winners back through filtered patch transplant.
6. U6 adds the operator-facing ledger and controls.
7. U7 proves the whole loop behaves correctly end to end.

This ordering keeps policy and isolation ahead of delegation, and delegation ahead of promotion.

---

## Scope Boundaries

### Deferred to Follow-Up Work

- Parallel attempt execution across multiple worktrees at once
- Smarter attempt selection based on prior attempt history or category-specific planners
- Automatic commit creation for promoted winners
- Full browser-based realism verification inside the attempt loop
- Multi-agent voting between several delegated workers on the same baseline

### Outside This Plan

- UI redesign or gameplay-shell changes
- Test or evaluator rewrites as part of optimization attempts
- Merge-based branch promotion
- Two-phone or networked multiplayer work

---

## Risks and Mitigations

- **Risk:** Delegated attempts cheat by editing the benchmark.
  - **Mitigation:** Protected path policy, changed-file validation, and parent-owned evaluation.
- **Risk:** Worktree attempts fail for environmental reasons unrelated to code quality.
  - **Mitigation:** Explicit worktree lifecycle helpers, dependency handling guidance, and attempt metadata that distinguishes infra failure from candidate failure.
- **Risk:** The `best available win` function accepts noisy or misleading improvements.
  - **Mitigation:** Require green verification, a minimum aggregate delta, and bounded regression tolerance with explicit scoring rules.
- **Risk:** Patch transplant diverges from worktree behavior.
  - **Mitigation:** Re-run full verification after transplant in the main checkout before accepting the promotion.
- **Risk:** The system becomes hard to inspect or debug after several attempts.
  - **Mitigation:** Persist a full attempt ledger with baseline, per-attempt scores, changed files, and promotion outcomes.

---

## Verification Strategy

- Unit-style tests for path policy, worktree lifecycle, attempt validation, score comparison, and patch transplant filtering
- Acceptance coverage for the full parent orchestrator using controlled attempt fixtures
- Real script-driven dry run proving:
  - worktree creation
  - delegated attempt launch
  - fixed evaluation
  - rejection of invalid attempts
  - promotion of a valid improving attempt
- Post-transplant verification in the main checkout on every winning attempt

---

## Deferred Questions

- Whether the delegated worker should use the current session's Codex runtime directly or a separate CLI/process wrapper
- Whether failed worktrees should be deleted immediately or archived by default for inspection
- Whether promotion should stop on first acceptable win or keep searching within a fixed attempt budget
