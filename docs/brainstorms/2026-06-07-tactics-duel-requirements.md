---
date: 2026-06-07
topic: tactics-duel
---

# Tactics Duel Requirements

## Summary

Build a same-device hot-seat 5v5 football tactics game where two coaches secretly enter one opening prompt and one halftime prompt, then watch autonomous player agents play out a short match on a shared screen. The product should feel like a quick tactical duel for football fans hanging out together, not a deep sports simulation.

---

## Problem Frame

The target moment is friends in the same place, waiting around, already talking football and arguing tactics. Existing football games are too heavy for that moment: they take too long, ask for too much control literacy, and do not convert tactical banter into a fast playable contest.

The opportunity is not “make a better football sim.” It is to turn football tactics talk into a low-commitment social game that resolves quickly enough to compete with scrolling on a phone or doing nothing at all.

---

## Key Decisions

- **Prompt-vs-prompt is the product.** The core interaction is each coach giving one opening prompt and one halftime prompt, then watching the match resolve. The game is proving whether tactic prompts create fun and legible football behavior, not whether manual controls feel good.
- **Shared-device hot-seat is the v1 environment.** The first version is designed for one device passed between players in the same room, with secrecy handled socially rather than through networking or account infrastructure.
- **Fast over deep.** A match should feel finished in roughly 2 to 3 minutes. Compression, readability, and replay value matter more than simulation depth.
- **Legible tactics over pure chaos.** The engine should mostly reward shape discipline and coordinated attacking play. Drama matters, but it should emerge from tactical interaction rather than random spectacle.
- **Free-form prompts stay visible to the player.** Coaches write natural language, not explicit command tags. The system may interpret broadly, but the experience should still feel like “I coached that outcome.”

---

## Actors

- A1. Coach 1
- A2. Coach 2
- A3. Team agents for Coach 1
- A4. Team agents for Coach 2
- A5. Shared-screen audience state

---

## Requirements

- R1. The game must support a two-player same-device hot-seat flow where each coach can enter a private opening tactic prompt before the match begins.
- R2. The game must support one halftime tactic prompt per coach that can revise, counter, or reframe the first-half plan before play resumes.
- R3. The match must present as a short shared-screen football duel that typically resolves in 2 to 3 minutes.
- R4. Each side must field 5 autonomous player agents at a time in a 5v5 format.
- R5. The field must be represented in a grid-like way that makes relative position, spacing, and movement readable during play.
- R6. Match presentation must feel continuous in motion, even if the underlying simulation resolves in smaller steps.
- R7. Player agents must be able to make football-core decisions including move, pass, shoot, dribble or carry, make a run, mark, press, intercept, and clear.
- R8. Player-agent behavior must respond to both local game state and the coach’s tactic prompt, rather than acting as fixed scripted pieces.
- R9. The simulation must primarily reward shape discipline and coordinated attacking play, including positioning, passing combinations, and tactical movement off the ball.
- R10. The simulation must allow tactical counters between teams so one coach’s plan can visibly disrupt or punish the other team’s setup.
- R11. When a prompt is vague, contradictory, or unrealistic, the game must continue with a best-effort interpretation rather than blocking the match.
- R12. The result of prompt interpretation must remain legible enough that players can plausibly connect visible team behavior back to the coaching instructions.
- R13. The product must create notable football moments such as chances, interceptions, goals, or momentum swings often enough that the match feels alive rather than sterile.
- R14. Prompt entry on a shared device must preserve basic tactical secrecy through a pass-and-hide flow that does not add much friction to starting a match.
- R15. The game must end in a clear outcome that supports immediate replay and comparison between the two coaches.

---

## Key Flows

- F1. Start and opening prompts
  - **Trigger:** Two players begin a new match on one shared device.
  - **Actors:** A1, A2, A5
  - **Steps:** Coach 1 enters an opening tactic prompt privately, passes the device, Coach 2 enters an opening tactic prompt privately, and the match begins.
  - **Outcome:** Both teams enter play with distinct coaching intent and no extra setup burden.

- F2. First-half autonomous play
  - **Trigger:** Opening prompts are locked in.
  - **Actors:** A3, A4, A5
  - **Steps:** Both teams play out the first half through autonomous decisions on a continuous-looking field, reacting to their coach prompt, the opponent, and the ball state.
  - **Outcome:** Players can watch recognizable tactical behavior emerge without direct control.

- F3. Halftime adjustment
  - **Trigger:** First-half play ends.
  - **Actors:** A1, A2, A5
  - **Steps:** Each coach gets one private halftime prompt to change shape, counter the opponent, or make an all-in shift before the second half starts.
  - **Outcome:** The second half becomes a strategic response, not just a continuation of the first.

- F4. Match resolution and replay
  - **Trigger:** Second-half play completes.
  - **Actors:** A1, A2, A5
  - **Steps:** The game resolves to a winner or clear result, shows enough context for the players to react to what happened, and offers an immediate rematch path.
  - **Outcome:** The session naturally feeds banter, replay, and tactical comparison.

---

## Acceptance Examples

- AE1. Covers R1, R2, R14.
  - **Given:** Two players share one phone.
  - **When:** They start a new match.
  - **Then:** Each player can enter an opening prompt privately, repeat that flow at halftime, and begin play without a long setup ritual.

- AE2. Covers R7, R8, R9, R12.
  - **Given:** A coach prompt emphasizes staying compact, pressing in midfield, and using quick passing combinations.
  - **When:** The first half plays out.
  - **Then:** The team should visibly preserve shape, contest space, and attempt coordinated passing behavior often enough that the prompt meaning is recognizable.

- AE3. Covers R10, R13, R15.
  - **Given:** Two teams enter with different tactical ideas.
  - **When:** Their plans collide over the course of the match.
  - **Then:** The game should produce readable counters, notable football moments, and a clear final result that invites a rematch.

- AE4. Covers R11, R12.
  - **Given:** A coach writes a prompt that is somewhat vague or overly ambitious.
  - **When:** The match starts.
  - **Then:** The game should continue with a best-effort tactical reading rather than rejecting the prompt, while still producing behavior that feels meaningfully tied to it.

---

## Success Criteria

- The match loop is short enough that a casual pair can finish a game in a waiting-around moment without feeling trapped in a long session.
- Players can describe at least in plain terms why their team behaved the way it did from the prompt they gave.
- Matches generate enough visible football moments and tactical contrast that replay feels like testing a new idea, not rerunning the same animation.
- The game feels social on one shared device rather than awkward or over-ceremonial during prompt entry and rematch.

---

## Scope Boundaries

### Deferred for later

- Two-phone local play.
- Remote or asynchronous multiplayer.
- Additional coach intervention during active play beyond the opening prompt and halftime prompt.
- Deeper player individuality, richer personalities, or advanced football nuance beyond the core action vocabulary.

### Outside this product's identity

- Deep manual-control football gameplay.
- Full-match simulation depth as the main value proposition.
- Complex sports-management meta systems, roster building, or long-term progression as part of the core v1 loop.

---

## Dependencies / Assumptions

- The product assumes players are comfortable with social pass-and-hide behavior for prompts in a same-room setting.
- The product assumes free-form prompt interpretation can be made legible enough that outcomes feel tactical rather than arbitrary.
- The product assumes a compressed football abstraction can still feel recognizably football-like while remaining readable on a shared screen.
