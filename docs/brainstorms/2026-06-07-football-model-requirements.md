---
date: 2026-06-07
topic: football-model
---

# Football Model Requirements

## Summary

Upgrade `tactics-master` from a team-possession prototype into a real football event model with explicit ball state, understandable passes and turnovers, and goal creation that comes from readable sequences rather than heuristic edge hits. The goal of this slice is to make the match itself feel football-like and arguable without turning the product into a deep simulation.

---

## Problem Frame

The current prototype already proves the broad social loop: two coaches can enter prompts, watch a match, adjust at halftime, and replay. But the football underneath is still too abstract. The ball does not meaningfully belong to a player, passes are not real transfers, defenders do not truly pressure or win the ball, and goals do not emerge from recognizable attacking sequences.

That breaks the product at the exact place it needs trust. A tactics duel only works when the players can watch a sequence and argue about whether the move was smart. If possession, pressure, and scoring are opaque or arbitrary, the tactical prompt layer above it becomes hard to believe no matter how good the AI wording gets.

---

## Key Decisions

- **Ball realism is the next priority.** This slice exists to fix the football model itself before broader polish or expansion.
- **AI stays at the tactical-choice layer.** The AI should choose the tactical move and likely actor for the next moment, but the engine still resolves whether it works.
- **Explicit ball state replaces team-only possession.** The model must support ball carrier, ball in transit, contested loose balls, blocks, rebounds, and recoveries as real events.
- **Balanced chance creation is required.** Goals should come from both structured possession play and disorder such as interceptions, loose balls, and transition mistakes.
- **Readability support is allowed, but tightly scoped.** Visual changes should exist to explain the new football model, not to reopen broad UI redesign work.

---

## Actors

- A1. Coach 1
- A2. Coach 2
- A3. Team-turn reasoning layer
- A4. Ball carrier or receiving player
- A5. Defenders applying pressure or contesting the ball
- A6. Shared-screen audience state

---

## Requirements

**Ball state and possession**

- R1. The simulation must replace team-level possession as the canonical ball model with explicit ball state.
- R2. Ball state must support at minimum: controlled by one player, in transit, loose, blocked, and recovered.
- R3. Passes and carries must transfer or preserve ball ownership through explicit football events rather than heuristic coordinate movement alone.
- R4. The model must support contested loose-ball phases rather than instant clean possession flips.

**Attacking actions**

- R5. The AI-driven tactical layer must be able to choose the next tactical move and likely actor for attacking sequences.
- R6. The engine must support real attacking events such as pass, carry, shot, switch, and recovery follow-up, with success or failure resolved by state and opposition.
- R7. Goals must emerge from understandable football sequences such as build-up, transition, rebound, or turnover-created chances rather than boundary checks alone.
- R8. The model must produce both structured chances and transition chances in a balanced way.

**Defensive actions**

- R9. Defenders must be able to apply explicit pressure to the ball carrier rather than only influence team-level turnover odds.
- R10. The model must support pressure, tackle, interception, block, and loose-ball recovery as distinct defensive event types.
- R11. Ball-winning actions must be spatially believable enough that players can tell why possession changed hands.

**Readability**

- R12. The match must make it understandable who is on the ball at any given moment.
- R13. Pressure on the ball carrier must be visible on screen without cluttering the field.
- R14. The sequence leading to a goal, turnover, or failed attack must be readable enough that two players can argue about it afterward.

**Pacing and product fit**

- R15. The richer football model must still fit the product’s short shared-screen duel shape rather than slowing into deep-sim pacing.
- R16. The model must remain compatible with halftime tactical revision and the same-device replay loop.

---

## Key Flows

- F1. Controlled possession to pass
  - **Trigger:** A team has a ball carrier in settled possession.
  - **Actors:** A3, A4, A5, A6
  - **Steps:** The tactical layer selects the likely actor and next move, the engine resolves the pass or carry, defenders pressure or contest if relevant, and the resulting ball state becomes visible.
  - **Outcome:** Possession sequences read like football rather than abstract drift.

- F2. Pressure and turnover
  - **Trigger:** A carrier is under defensive pressure or attempts a risky move.
  - **Actors:** A3, A4, A5, A6
  - **Steps:** Defenders close, tackle, intercept, or block; the ball may stay controlled, go loose, or change sides after a recovery.
  - **Outcome:** Turnovers feel earned and understandable instead of periodic random flips.

- F3. Chance creation and shot resolution
  - **Trigger:** A team reaches a dangerous attacking state through build-up or transition.
  - **Actors:** A3, A4, A5, A6
  - **Steps:** The attacking move resolves into a shot or final action, defenders may block or disrupt it, the keeper or recovery phase resolves the outcome, and any goal or rebound is shown as a sequence.
  - **Outcome:** Goals come from recognizable football moments.

- F4. Loose-ball and second phase
  - **Trigger:** A block, tackle, failed pass, or rebound breaks clean control.
  - **Actors:** A4, A5, A6
  - **Steps:** The ball becomes loose, nearby players compete for recovery, and the next possession is established from that contest.
  - **Outcome:** Disorder becomes playable and readable rather than skipped.

---

## Acceptance Examples

- AE1. Covers R1, R2, R3, R12.
  - **Given:** A team is in settled possession.
  - **When:** The next action is a pass.
  - **Then:** A specific player should be identifiable as the ball carrier before the pass, the ball should visibly move in transit, and a specific receiver or defender should determine the next ball state.

- AE2. Covers R9, R10, R11, R13.
  - **Given:** A carrier is holding the ball under nearby defensive threat.
  - **When:** The defense wins the moment.
  - **Then:** Pressure should be visible, the winning action should be classifiable as tackle, interception, block, or recovery, and the turnover should feel spatially motivated.

- AE3. Covers R6, R7, R8, R14.
  - **Given:** A team creates an attack through either structured build-up or a transition break.
  - **When:** The sequence ends in a goal or failed chance.
  - **Then:** The players watching should be able to describe the football sequence that led there, not just observe that the score changed.

- AE4. Covers R4, R10, R15.
  - **Given:** A shot is blocked or a pass breaks down.
  - **When:** The ball becomes loose.
  - **Then:** Recovery and second-ball behavior should occur quickly enough to keep the match flowing while still feeling like a real contested phase.

---

## Success Criteria

- Players can consistently tell who has the ball, who is threatening it, and why possession changed.
- Matches produce real passes, recoveries, and chances often enough that the duel feels football-like rather than symbolic.
- Goals happen through readable sequences instead of seeming arbitrary or missing entirely.
- The richer football model preserves the fast shared-screen pace that makes the product socially usable.

---

## Scope Boundaries

### Deferred for later

- Per-player independent AI reasoning.
- Rich goalkeeper-specific intelligence beyond what is needed to support readable save or block outcomes.
- Deeper set-piece, foul, offside, or card systems.
- Two-phone or remote multiplayer implications of the new ball model.

### Outside this product's identity

- Deep full-match football simulation with full realism as the core value proposition.
- Manual control of players during active play.
- Complex managerial systems built on top of the richer football model.

---

## Dependencies / Assumptions

- The current tactical-choice layer can remain above the simulation if the simulation becomes rich enough to express and resolve real football events.
- The team-turn AI layer remains bounded; this slice is not an argument for per-tick or per-player unconstrained reasoning.
- A limited set of readability cues, especially around pressure and ball ownership, will be enough to explain the richer football model on the shared screen.
