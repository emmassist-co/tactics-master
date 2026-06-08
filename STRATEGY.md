---
name: tactics-master
last_updated: 2026-06-07
---

# tactics-master Strategy

## Target problem

Football fans hanging out in person want a quick game to play with friends while waiting around, like at halftime over beers. Existing football games take too long, move too slowly, and leave too little room for tactical tricks and banter.

## Our approach

`tactics-master` wins by turning football tactics into a low-commitment social duel instead of a deep simulation. Players act like coaches, give natural-language instructions, and get fast, surprising outcomes that keep the game engaging and the banter moving.

## Who it's for

**Primary:** Football fans hanging out in person - They're hiring `tactics-master` to play a quick football-like game with friends and compete on their tactics.

## Key metrics

- **Rematch rate** - Percentage of finished games followed by another game from the same players soon after; measured in game session analytics.
- **Game completion rate** - Percentage of started games that reach a winner; measured in game session analytics.
- **Average game duration** - Time from first prompt to winner, to confirm the game stays short enough for casual table play; measured in game session analytics.
- **Prompt turns per game** - Number of coach instructions players give before the game ends, showing whether the tactics mechanic is actually being used; measured in game session analytics.
- **High-drama moment rate** - Percentage of games with at least one notable swing event such as a goal, interception, counter, or upset turn; measured from match event logs.

## Tracks

### Core match engine

The round-based football rules, win conditions, and field interactions that make the game fair, readable, and fast.

_Why it serves the approach:_ If the underlying game loop is slow, confusing, or unbalanced, the low-commitment social duel falls apart.

### Agent interpretation

Turning coach-style prompts into believable tactical actions without making players learn manual controls.

_Why it serves the approach:_ Natural-language coaching is the core product bet and the main thing that separates this from standard football games.

### Pacing and drama

Keeping games short, readable, and full of swing moments worth reacting to.

_Why it serves the approach:_ The product only works if it creates fast engagement and enough drama to sustain banter.

### Social play loop

Structuring turn-taking, results, and rematches so the game works naturally around a table.

_Why it serves the approach:_ The game is built for friends in a live social setting, so the loop has to support easy pickup, quick resolution, and replay.
