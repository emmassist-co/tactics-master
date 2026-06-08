---
title: Plan football-model simulation upgrade
type: feat
status: active
date: 2026-06-07
origin: docs/brainstorms/2026-06-07-football-model-requirements.md
---

# Plan football-model simulation upgrade

## Summary

Build a new match simulation core in parallel with the current engine so `tactics-master` can move from symbolic possession drift to explicit football events. The new core should model ball ownership, ball transit, pressure, tackles, interceptions, blocks, loose balls, recoveries, shots, saves, and goals as readable sequences while preserving the same shared-screen 5v5 duel, halftime reset, and short match duration.

---

## Problem Frame

The current prototype already proves the product shell: prompt entry, halftime adjustment, result flow, and a watchable shared-screen match. But the football model underneath is still too shallow. Possession is team-level, ball movement is heuristic, defenders do not truly contest the carrier, passes are not actual transfers, and goals come from edge conditions rather than recognisable attacking sequences.

That breaks trust in the core product bet. A tactics duel only works if players can look at a moment and understand who had the ball, who pressured, why possession changed, and how the goal happened. The next slice therefore needs to fix the football before adding broader features or more UI polish.

---

## Requirements Traceability

This plan implements the explicit-ball-state upgrade defined in `docs/brainstorms/2026-06-07-football-model-requirements.md`.

- R1-R4: explicit ball state replaces team-level possession, including transit and loose-ball phases.
- R5-R8: AI chooses the tactical move and likely actor; the engine resolves attacking sequences into readable chances and goals.
- R9-R11: pressure, tackle, interception, block, and recovery become distinct defensive events.
- R12-R14: the match clearly communicates carrier, pressure, turnover, and goal chains.
- R15-R16: the richer football model still fits the short same-device duel and halftime revision loop.

---

## Key Technical Decisions

- KTD1. **Build a parallel simulation core, not an in-place patch.** The current engine is too team-possession-centric to safely extend. A parallel core keeps the old prototype playable while the new model is validated.
- KTD2. **Make ball state first-class.** The canonical state should represent `controlled`, `in-transit`, `loose`, `blocked`, and `saved/rebounded` outcomes, with explicit actor references where relevant.
- KTD3. **Keep AI at the tactical-choice layer.** Team-turn reasoning should choose the next move and likely actor, but deterministic execution should still resolve legality, ranges, contests, success, and second-ball outcomes.
- KTD4. **Resolve football as event chains, not scalar drift.** Possessions should be composed from explicit events like `carry -> pressure -> pass -> interception` or `switch -> receive -> shot -> block -> recovery`.
- KTD5. **Keep the on-screen readability layer narrow.** Add only the cues required to explain the richer football model: clear carrier state, visible pressure, and event labels tied to actual engine events.
- KTD6. **Define a real cutover step.** The repo should not carry two match engines indefinitely. The plan must end with the new core becoming the default path and the old engine being retired or isolated as legacy scaffolding.

---

## High-Level Technical Design

The new runtime should separate four concerns:

1. `Tactical plan and team-turn reasoning`
2. `Explicit ball-state match simulation`
3. `Readable event log and playback snapshots`
4. `UI cues for carrier and pressure`

The core runtime seam becomes:

`TacticalPlan -> TeamDecision -> MatchIntent -> ExplicitBallState transition -> Snapshot/Event output`

Directionally, a possession should resolve as a short event chain:

```text
decision window
-> team decision and likely actor
-> engine selects legal event candidate
-> opposition contest resolves
-> ball state changes
-> follow-up state or second-ball phase
-> snapshot and event label emitted
```

That keeps the AI authored at the tactical level while making the football outcome come from deterministic, testable event resolution.

---

## System-Wide Impact

- `src/domain/match` gains a parallel explicit-ball-state engine instead of extending the current `hasBall` and team-possession flow.
- `src/domain/reasoning` keeps the current team-turn provider shape, but its outputs need to drive likely actors and football event intents rather than generic bias.
- `src/components/MatchView.tsx` and player rendering need clearer carrier and pressure cues derived from the new snapshots.
- Acceptance tests must shift from generic match completion to sequence-level football correctness.

---

## Implementation Units

### U1. Define the new explicit ball-state domain model

- **Goal:** Create the state model the new engine will run on, including explicit ball ownership and contested phases.
- **Requirements:** R1, R2, R4, R12.
- **Dependencies:** None.
- **Files:**
  - `src/domain/match-v2/types.ts`
  - `src/domain/match-v2/initialState.ts`
  - `src/domain/match-v2/positions.ts`
  - `src/domain/match-v2/types.test.ts`
- **Approach:** Introduce a parallel `match-v2` package rather than mutating the current engine in place. The state should include player positions, facing team shape, and an explicit ball object that can reference a controller, a transit path, or a loose-ball zone. Snapshot types should already carry the fields the UI will need later, especially `ballState`, `carrierId`, `pressure`, and event metadata.
- **Patterns to follow:** Preserve the current snapshot-first playback model, but stop encoding possession only as a team string plus free-floating coordinates.
- **Test scenarios:**
  - Controlled possession can reference exactly one carrier.
  - In-transit ball state can reference origin, target, and remaining travel.
  - Loose-ball state can exist without assigning instant clean possession.
  - Snapshot serialization remains stable for playback consumers.
- **Verification:** `src/domain/match-v2/types.test.ts`

### U2. Add intent shaping from team decisions to likely football actions

- **Goal:** Translate team-turn reasoning output into bounded football intents that the new engine can actually resolve.
- **Requirements:** R5, R6, R9, R15.
- **Dependencies:** U1.
- **Files:**
  - `src/domain/match-v2/intentTypes.ts`
  - `src/domain/match-v2/selectIntent.ts`
  - `src/domain/match-v2/selectIntent.test.ts`
  - `src/domain/reasoning/types.ts`
  - `src/domain/reasoning/teamTurnContext.ts`
- **Approach:** Keep the current team-turn interface, but make its output concrete enough for the new engine: likely actor, intended action family, target lane or zone, and risk posture. The engine should not infer a whole possession from a vague label. It should receive a bounded intent like “anchor recycles left,” “link plays vertical pass,” or “runner attacks loose ball.”
- **Patterns to follow:** Preserve the current team-turn provider seam; do not collapse the new engine back into raw prompt interpretation.
- **Test scenarios:**
  - A possession-heavy decision in build-up maps to pass or carry intents with conservative risk.
  - A pressured carrier can map to clear, short pass, or escape carry rather than illegal shot-first behavior.
  - Defensive decisions can nominate pressing or interception-oriented likely actors.
  - The intent shaper rejects out-of-shape actor/action combinations.
- **Verification:** `src/domain/match-v2/selectIntent.test.ts`

### U3. Implement explicit event resolution for passes, carries, pressure, and turnovers

- **Goal:** Make ball progression and ball-winning events real.
- **Requirements:** R3, R4, R9, R10, R11, R14.
- **Dependencies:** U1, U2.
- **Files:**
  - `src/domain/match-v2/resolvePass.ts`
  - `src/domain/match-v2/resolveCarry.ts`
  - `src/domain/match-v2/resolvePressure.ts`
  - `src/domain/match-v2/resolveTurnover.ts`
  - `src/domain/match-v2/transition.ts`
  - `src/domain/match-v2/__tests__/resolvePass.test.ts`
  - `src/domain/match-v2/__tests__/resolveCarry.test.ts`
  - `src/domain/match-v2/__tests__/resolveTurnover.test.ts`
- **Approach:** Resolve progression as explicit event transitions. Passes should produce transit windows and interception chances. Carries should expose the carrier to pressure and tackle risk. Blocks and failed actions should create loose balls instead of binary possession flips. Nearby-player recovery logic should then establish the next controller or second phase.
- **Patterns to follow:** Prefer small pure resolution functions over one monolithic match stepper. Each event type should expose enough intermediate detail to drive readable playback.
- **Test scenarios:**
  - Successful pass transfers control from passer to receiver after transit.
  - Intercepted pass credits the defender and establishes the new controlled state.
  - Pressured carry can end in retained control, tackle loss, forced recycle, or loose ball.
  - Blocked action can create a recoverable second-ball phase instead of jumping directly to a new team possession string.
- **Verification:** `src/domain/match-v2/__tests__/resolvePass.test.ts`, `src/domain/match-v2/__tests__/resolveCarry.test.ts`, `src/domain/match-v2/__tests__/resolveTurnover.test.ts`

### U4. Implement chance creation, shots, saves, blocks, and goals

- **Goal:** Make scoring come from understandable attacking sequences rather than boundary checks.
- **Requirements:** R6, R7, R8, R10, R14, R15.
- **Dependencies:** U1, U2, U3.
- **Files:**
  - `src/domain/match-v2/chanceAssessment.ts`
  - `src/domain/match-v2/resolveShot.ts`
  - `src/domain/match-v2/resolveSave.ts`
  - `src/domain/match-v2/__tests__/resolveShot.test.ts`
  - `src/domain/match-v2/__tests__/chanceAssessment.test.ts`
- **Approach:** Gate shots behind meaningful chance states: dangerous zone, supporting shape, transition advantage, or rebound sequence. Shot resolution should support at least goal, save, block, miss, and rebound outcomes. Keeper behavior can stay simple, but the sequence should still explain why the chance succeeded or failed.
- **Patterns to follow:** Keep the football model compressed for a 2-to-3-minute match; do not expand into a full keeper or set-piece subsystem.
- **Test scenarios:**
  - Structured build-up can create a final-third shot chance that may end in goal or save.
  - Transition mistake can create a fast chance without requiring long possession buildup.
  - Blocked shot can produce a rebound or loose-ball recovery.
  - Goal events include enough metadata for the UI to explain the sequence.
- **Verification:** `src/domain/match-v2/__tests__/resolveShot.test.ts`, `src/domain/match-v2/__tests__/chanceAssessment.test.ts`

### U5. Build the parallel match loop and snapshot emitter

- **Goal:** Run the new engine as a full match producer without yet replacing the current one.
- **Requirements:** R1, R8, R15, R16.
- **Dependencies:** U1, U2, U3, U4.
- **Files:**
  - `src/domain/match-v2/simulateMatch.ts`
  - `src/domain/match-v2/simulateTick.ts`
  - `src/domain/match-v2/createInitialMatch.ts`
  - `src/domain/match-v2/toSnapshot.ts`
  - `src/domain/match-v2/__tests__/simulateMatch.test.ts`
- **Approach:** Build a complete parallel match loop that consumes the existing opening and halftime tactical plans plus team-turn decisions, then emits playback-ready snapshots. Keep half structure, duration envelope, and result semantics aligned with the current app so the new engine can be swapped in with minimal flow changes later.
- **Patterns to follow:** Reuse the current `simulateMatchAsync` orchestration shape where it still helps, but do not constrain the new core to the old snapshot internals.
- **Test scenarios:**
  - A full match completes with a valid result and halftime transition.
  - Possession evolves through explicit ball states rather than team-only drift.
  - Typical matches contain passes, contests, and shots often enough to feel football-like.
  - The match still finishes inside the intended pacing envelope.
- **Verification:** `src/domain/match-v2/__tests__/simulateMatch.test.ts`

### U6. Add minimum readability cues for carrier and pressure

- **Goal:** Surface the new football model clearly without reopening a full UI redesign.
- **Requirements:** R12, R13, R14.
- **Dependencies:** U5.
- **Files:**
  - `src/components/MatchView.tsx`
  - `src/components/PlayerSprite.tsx`
  - `src/components/BallSprite.tsx`
  - `src/styles/match.css`
  - `src/components/__tests__/MatchView.test.tsx`
- **Approach:** Use the new snapshot fields to clearly mark the carrier, show pressure rings or equivalent proximity cues, and label key football events coming from the engine. Avoid adding noisy pass-lane overlays or debug chrome in this slice.
- **Patterns to follow:** Preserve the current visual direction and shared-screen readability. The UI should explain the model, not compete with it.
- **Test scenarios:**
  - The current carrier is visually identifiable.
  - Pressured carriers show visible threat without cluttering every player.
  - Turnovers and goals reflect real engine event labels rather than generic possession text.
  - Ball-in-transit states do not look like teleportation.
- **Verification:** `src/components/__tests__/MatchView.test.tsx`

### U7. Cut over the app flow to the new engine and retire the old default path

- **Goal:** Make the new football model the primary runtime and remove ambiguity about which engine powers the game.
- **Requirements:** R1-R16, especially R15-R16.
- **Dependencies:** U5, U6.
- **Files:**
  - `src/state/gameFlow.ts`
  - `src/App.tsx`
  - `src/domain/match/simulateMatch.ts`
  - `src/test/acceptance/tacticsDuel.acceptance.test.ts`
  - `README.md`
- **Approach:** Switch the app flow to the new match-v2 engine once acceptance coverage proves it. Keep the legacy engine only if it remains useful for fixture comparison or fallback experimentation; otherwise isolate or remove it so the repo has one clear football model. Update the README to explain the new engine architecture and what OpenRouter now influences versus what remains deterministic.
- **Patterns to follow:** Prefer clarity over backwards-compatibility. Once cutover happens, code should read like one game, not two half-maintained implementations.
- **Test scenarios:**
  - A normal same-device match uses the new engine end to end.
  - Halftime still revises team behavior without resetting the match.
  - Acceptance coverage proves real passes, recoveries, pressure, and goal chains exist in match output.
  - Legacy engine references no longer drive the default app path.
- **Verification:** `src/test/acceptance/tacticsDuel.acceptance.test.ts`, `src/App.test.tsx`

---

## Sequencing

1. U1 defines the domain boundary for the new engine.
2. U2 constrains what the reasoning layer can ask the engine to do.
3. U3 and U4 implement the actual football event system.
4. U5 assembles those pieces into a full playable parallel match loop.
5. U6 exposes only the minimum cues needed to read the richer model.
6. U7 cuts the app over and removes the old default path.

This ordering keeps the risky work inside the parallel core until the new model can prove sequence correctness and pacing.

---

## Risks and Mitigations

- **Risk:** The richer model slows matches down or reduces event density.
  - **Mitigation:** Keep chance assessment and recovery logic intentionally compressed; test match duration and event frequency as first-class acceptance concerns.
- **Risk:** The AI layer asks for intents the new engine cannot express cleanly.
  - **Mitigation:** Tighten the `MatchIntent` contract early and normalize team-turn outputs before they reach resolution code.
- **Risk:** The new engine becomes more realistic but less readable.
  - **Mitigation:** Emit explicit event metadata from the engine itself and use that to drive carrier and pressure cues.
- **Risk:** The repo gets stuck with parallel engines for too long.
  - **Mitigation:** Make cutover an explicit implementation unit with acceptance gates, not a vague future cleanup task.

---

## Verification Strategy

- Unit tests around explicit ball-state types and event resolution functions.
- Match-level tests proving passes, turnovers, shots, and loose-ball recoveries occur as explicit sequences.
- UI tests proving carrier and pressure cues reflect snapshot state.
- Acceptance tests proving a full same-device match still works and now produces readable football chains.
- Manual smoke check after cutover: run a full opening prompt -> halftime prompt -> result flow and inspect whether goals and turnovers are now explainable on screen.

---

## Deferred Work

- Per-player independent AI reasoning.
- Rich goalkeeper intelligence beyond bounded shot resolution.
- Fouls, cards, offside, set pieces, or stoppage-heavy rules.
- Two-phone or remote multiplayer implications of the new engine.
- Broad visual redesign work unrelated to ball-state readability.
