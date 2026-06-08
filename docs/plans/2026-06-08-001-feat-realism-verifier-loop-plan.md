---
title: Plan realism verifier loop
type: feat
status: active
date: 2026-06-08
---

# Plan realism verifier loop

## Summary

Build a realism evaluation harness for `tactics-master` that scores match believability from simulation traces first, then sanity-checks the result with browser-captured visual review. The output should support repeated local iteration loops and declare the game “ready” only when all realism categories clear minimum floors and the combined score reaches at least `4/5` for mini-figure football, not full realism football.

---

## Problem Frame

The current football model is now structurally testable and browser-playable, but realism is still being judged informally. That creates two problems. First, future engine tweaks will drift without a stable definition of “better.” Second, the agent can make changes that improve one dimension, like scoring frequency, while making another one worse, like spacing or pressure shape, without any durable feedback loop catching the regression.

The next step is therefore not more direct simulation work. It is a verifier system that can score realism repeatedly, preserve evidence, and tell the implementer whether a pass actually moved the game closer to believable mini-figure football.

---

## Requirements Traceability

This plan is sourced from the current browser-verified state of the repo and the follow-up request to create realism verifiers and an iteration loop.

- Trace scoring is the primary authority for realism readiness.
- Browser review is a secondary visual sanity check, not the main gate.
- The realism gate must include four categories:
  - off-ball shape
  - ball interactions
  - pressure and defending
  - chance creation
- Readiness requires:
  - category floors
  - an overall score of at least `4/5`
- The loop should support repeated local realism passes by the agent, not a CI-enforced shipping gate yet.

---

## Key Technical Decisions

- KTD1. **Trace-first scoring, browser-second review.** Simulation traces are the primary scoring authority because they are stable, automatable, and easy to compare across runs. Browser review exists to catch visual falseness that trace metrics can miss.
- KTD2. **Category floors plus overall score.** One strong metric cluster must not hide one fake-looking system. Each realism category needs its own minimum bar, plus a combined score of at least `4/5`.
- KTD3. **Artifact-backed evaluation.** Every realism run should produce machine-readable scores plus saved evidence such as trace summaries, screenshots, and optional recordings.
- KTD4. **Local iteration loop before CI gate.** The first version should optimize for fast local agent feedback and reproducible evidence. It does not need to block every test run or every build yet.
- KTD5. **Mini-figure realism, not sim realism.** The scoring rubric should reward believable shape, motion, and football logic within the toy format. It should not punish the product for intentionally abstracting away deep football rules.

---

## High-Level Technical Design

The realism system should have four layers:

1. `Trace capture` from `match-v2` runs
2. `Deterministic realism scoring` over those traces
3. `Browser evidence capture and rubric review`
4. `Iteration loop and readiness report`

```text
match fixture
-> simulate match
-> collect trace metrics
-> compute category scores
-> capture browser artifacts
-> apply visual rubric
-> combine into readiness report
-> compare against 4/5 gate
```

The key runtime seam is:

`match output -> realism metrics -> realism scorecard -> readiness verdict`

This keeps the verifier loop independent from the simulation implementation details while still letting future football passes improve against a stable target.

---

## System-Wide Impact

- `src/domain/match-v2` will need richer exported trace data and possibly a normalized event stream.
- `src/test/acceptance` will shift from “playable and non-empty” to realism-aware fixtures and reports.
- The browser testing surface will move from ad hoc smoke checks to saved evaluation artifacts.
- Developer documentation needs a clear “how to run a realism pass” workflow.

---

## Implementation Units

### U1. Define the realism score model and readiness thresholds

- **Goal:** Establish the scoring schema, category definitions, weighting, and readiness thresholds that the rest of the harness will implement.
- **Requirements:** trace-first authority, four realism categories, category floors, overall `4/5` gate.
- **Dependencies:** None.
- **Files:**
  - `docs/brainstorms/2026-06-08-realism-verifier-requirements.md`
  - `src/domain/realism/types.ts`
  - `src/domain/realism/thresholds.ts`
  - `src/domain/realism/thresholds.test.ts`
- **Approach:** Define a normalized score model that separates raw metrics from interpreted category scores. Keep the scoring contract explicit: raw trace metrics feed category rubrics, category rubrics feed overall readiness. Thresholds should encode “mini-figure football realism” so the evaluator does not overfit toward full sim expectations.
- **Patterns to follow:** Mirror the bounded-domain style already used in `src/domain/tactics` and `src/domain/reasoning`.
- **Test scenarios:**
  - A scorecard with all categories above floor and overall `>= 4.0` returns a ready verdict.
  - A scorecard with one category below floor fails even if the weighted overall score passes.
  - Threshold logic distinguishes mini-figure realism from strict full-sim assumptions.
- **Verification:** `src/domain/realism/thresholds.test.ts`

### U2. Add normalized trace export from the match engine

- **Goal:** Export the event and state data the realism scorer needs from `match-v2`.
- **Requirements:** trace-first scoring, artifact-backed evaluation.
- **Dependencies:** U1.
- **Files:**
  - `src/domain/match-v2/types.ts`
  - `src/domain/match-v2/simulateMatch.ts`
  - `src/domain/match-v2/trace.ts`
  - `src/domain/match-v2/trace.test.ts`
- **Approach:** Introduce a normalized trace format that can describe spacing snapshots, possession phases, pressure events, ball-in-transit intervals, recoveries, shots, and goal chains. Keep it independent from React playback concerns so the realism harness can score directly from engine output.
- **Patterns to follow:** Reuse the snapshot/event metadata already flowing through `MatchSnapshot`, but normalize it into scorer-friendly trace structures instead of scraping ad hoc fields later.
- **Test scenarios:**
  - A full simulated match emits trace data for key event types needed by the realism scorer.
  - Trace export preserves event ordering and phase transitions.
  - Loose-ball, recovery, and chance sequences can be reconstructed from the trace without UI context.
- **Verification:** `src/domain/match-v2/trace.test.ts`

### U3. Implement deterministic realism metrics and category scorers

- **Goal:** Turn normalized traces into per-category realism scores.
- **Requirements:** off-ball shape, ball interactions, pressure and defending, chance creation.
- **Dependencies:** U1, U2.
- **Files:**
  - `src/domain/realism/scoreTrace.ts`
  - `src/domain/realism/metrics/shape.ts`
  - `src/domain/realism/metrics/ballInteractions.ts`
  - `src/domain/realism/metrics/defending.ts`
  - `src/domain/realism/metrics/chanceCreation.ts`
  - `src/domain/realism/scoreTrace.test.ts`
- **Approach:** Build category scorers from concrete trace features such as average spacing stability, support depth spread, pass-to-receive coherence, interception plausibility, recovery clustering, defensive pressure timing, and shot-chain quality. Keep scoring deterministic and explainable so failures point to a football problem rather than an opaque grade.
- **Patterns to follow:** Prefer composable pure metric functions over one monolithic scorer.
- **Test scenarios:**
  - A trace with extreme bunching scores poorly on off-ball shape.
  - A trace with sparse passes, teleport-like receptions, or incoherent ball transfer scores poorly on ball interactions.
  - A trace with no meaningful pressure or unrealistic recoveries scores poorly on defending.
  - A trace with no believable shot chains scores poorly on chance creation.
  - Category scorers produce stable outputs for the same trace fixture.
- **Verification:** `src/domain/realism/scoreTrace.test.ts`

### U4. Add browser artifact capture and visual realism rubric

- **Goal:** Capture browser evidence and score visual believability as a secondary check.
- **Requirements:** browser sanity check, artifact-backed evaluation.
- **Dependencies:** U1, U2.
- **Files:**
  - `scripts/run-realism-browser-check.mjs`
  - `docs/testing/realism-rubric.md`
  - `src/domain/realism/browserReview.ts`
  - `src/domain/realism/browserReview.test.ts`
- **Approach:** Formalize the browser pass that is currently ad hoc. The script should drive a known match fixture, save screenshots and optional recordings, and score them against a lightweight rubric focused on visible spacing, ball readability, pressure readability, and whether attacks look football-like. Keep this rubric secondary to the trace gate.
- **Patterns to follow:** Reuse the existing `agent-browser` workflow shape already proven in this repo rather than inventing a different manual browser path.
- **Test scenarios:**
  - Browser review output includes artifact paths and rubric category scores.
  - Missing browser artifacts fail gracefully without corrupting the trace score.
  - The browser rubric can lower confidence or flag disagreement without overriding a failed trace gate into a pass.
- **Verification:** `src/domain/realism/browserReview.test.ts`, `docs/testing/realism-rubric.md`

### U5. Build the local realism loop runner and readiness report

- **Goal:** Create the agent-usable loop that runs fixtures, scores realism, collects evidence, and reports whether the game is ready.
- **Requirements:** repeated local iteration loop, category floors, overall `4/5` gate.
- **Dependencies:** U3, U4.
- **Files:**
  - `scripts/run-realism-loop.mjs`
  - `src/domain/realism/report.ts`
  - `src/domain/realism/report.test.ts`
  - `README.md`
- **Approach:** Implement one entrypoint that runs the deterministic trace scorer and optional browser review, then emits a concise report with category scores, overall score, failing metrics, and artifact locations. The report should be optimized for repeated local use by the agent after each realism pass.
- **Patterns to follow:** Match the repo’s current lightweight script-driven verification style rather than introducing a heavy orchestration system.
- **Test scenarios:**
  - A passing fixture generates a ready verdict and a readable report.
  - A failing fixture highlights which realism categories missed the bar.
  - Report output remains stable and parsable enough for repeated comparison across runs.
- **Verification:** `src/domain/realism/report.test.ts`, `README.md`

### U6. Create realism fixtures and acceptance coverage for regression detection

- **Goal:** Give the realism harness stable fixtures that can catch both improvement and regression.
- **Requirements:** repeated local iteration, category-based scoring, readiness gate.
- **Dependencies:** U2, U3, U5.
- **Files:**
  - `src/test/fixtures/realism/`
  - `src/test/acceptance/realismLoop.acceptance.test.ts`
  - `src/domain/match-v2/simulateMatch.test.ts`
- **Approach:** Add representative match fixtures that expose the kinds of falseness already observed: bunching, dead attacks, fake recoveries, and low-event drift. Acceptance coverage should prove the loop can distinguish obviously weak traces from stronger ones and that future football passes can be judged against those fixtures.
- **Patterns to follow:** Reuse the current acceptance style, but upgrade it from binary “playable” checks to scored realism assertions.
- **Test scenarios:**
  - A weak realism fixture fails at least one category floor.
  - A stronger fixture scores materially higher than a weak one on the expected categories.
  - The loop detects regressions in realism-sensitive fixtures even when generic playability still passes.
- **Verification:** `src/test/acceptance/realismLoop.acceptance.test.ts`

---

## Sequencing

1. U1 defines the realism contract and pass/fail semantics.
2. U2 exports stable trace data from the engine.
3. U3 implements the deterministic category scorers.
4. U4 formalizes browser evidence capture and the visual rubric.
5. U5 assembles those pieces into a reusable loop runner.
6. U6 anchors the whole system with realism fixtures and acceptance coverage.

This ordering keeps the readiness gate grounded in stable trace data before adding browser review and loop orchestration.

---

## Scope Boundaries

### Deferred to Follow-Up Work

- CI-blocking enforcement of the realism gate
- Automatic agent-driven simulation tuning after failed realism runs
- Full historical trend dashboards for realism scores over time
- Cross-branch or cross-PR realism comparison tooling

### Outside This Plan

- Direct simulation rewrites to improve realism
- New product features unrelated to realism evaluation
- Full human-only QA workflows as the main scoring path

---

## Risks and Mitigations

- **Risk:** The trace scorer rewards the wrong things and overfits the current engine.
  - **Mitigation:** Keep category metrics explicit and reviewable, and pair them with browser sanity checks.
- **Risk:** Browser review becomes too manual to run often.
  - **Mitigation:** Keep browser review lightweight and artifact-oriented, not long-form exploratory QA.
- **Risk:** The `4/5` gate is too easy or too harsh.
  - **Mitigation:** Separate raw metrics from thresholds so calibration can change without redesigning the harness.
- **Risk:** The loop becomes a one-off report instead of a reusable development tool.
  - **Mitigation:** Provide one repeatable entrypoint and stable report format for every realism pass.

---

## Verification Strategy

- Unit tests for threshold logic, category scorers, and report generation
- Match-trace tests proving the engine exports enough data for realism scoring
- Acceptance fixtures that distinguish weak realism from stronger realism
- Browser artifact runs that save screenshots and recordings alongside rubric output
- Manual spot-check of at least one recorded run whenever the harness itself changes

---

## Deferred Questions

- Whether browser rubric scoring should eventually be partially automated beyond artifact capture
- Whether the realism report should be JSON-first, markdown-first, or dual-output once the loop is in heavy use
- Whether the eventual CI gate should block on all realism categories or only on regression relative to a baseline
