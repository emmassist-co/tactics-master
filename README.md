# tactics-master

`tactics-master` is a same-device football tactics duel: two coaches each enter an opening prompt and a halftime prompt, then watch autonomous 5v5 teams play the ideas out on a grid field.

## Run

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm test
pnpm build
node scripts/run-realism-loop.mjs
node scripts/run-coach-matchups.mjs
node scripts/optimize-match-sim.mjs
```

## Preview deploys

GitHub Actions publishes the app to GitHub Pages on every push to `main` and every pull request update.

- Production-style review target: `https://emmassist-co.github.io/tactics-master/`
- PR preview target: `https://emmassist-co.github.io/tactics-master/previews/pr-<PR_NUMBER>/`

Reviewers can open the PR-specific URL directly after the `Preview Deploy` workflow finishes. The workflow job summary also prints the exact deployed URL for that run.

To reproduce a preview build locally, run:

```bash
PREVIEW_BASE_PATH=/tactics-master/previews/pr-123/ pnpm build
pnpm preview
```

## Optional live AI configuration

The app now supports an OpenRouter-backed team-turn reasoning provider. Without credentials it falls back to a bounded local provider, so the match still runs.

```bash
VITE_OPENROUTER_API_KEY=...
VITE_OPENROUTER_MODEL=openai/gpt-4.1-mini
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_SITE_URL=http://localhost:4173
VITE_OPENROUTER_APP_TITLE=tactics-master
```

## Current slice

- Shared-device hot-seat prompt flow
- `TacticalPlan` seam plus bounded team-turn reasoning
- Live AI team-turn provider with deterministic fallback behavior
- Parallel `match-v2` football engine with explicit ball control, passes in transit, loose balls, recoveries, pressure, shots, saves, and goals
- Continuous-looking playback with visible carrier and pressure cues
- Halftime tactical reset and replay loop

## Realism loop

Run the trace-first realism harness:

```bash
node scripts/run-realism-loop.mjs
```

Run it with browser artifacts too:

```bash
node scripts/run-realism-loop.mjs --url=http://127.0.0.1:4176/
```

The loop scores:

- `offBallShape`
- `ballInteractions`
- `defending`
- `chanceCreation`

Readiness requires every category floor to pass and an overall score of at least `4/5`.

## Coach matchup suite

Run the inspired-style matchup suite:

```bash
node scripts/run-coach-matchups.mjs
```

It runs stable prompt fixtures inspired by coaches like Guardiola, Klopp, Jorge Jesus, Mourinho, and Simeone, then reports:

- final score and winner per matchup
- realism score per matchup
- aggregate category averages across the whole suite
- how many inspired matchups currently clear the readiness bar

## Match optimizer loop

Run the local tuning loop:

```bash
node scripts/optimize-match-sim.mjs
```

It will:

- score the current app against the coach matchup suite
- create an isolated worktree per attempt
- ask a delegated `codex exec` worker to improve simulation-only code
- reject attempts that touch tests, evaluator code, docs, or UI
- run `pnpm test`, `pnpm build`, and the coach matchup suite in the attempt worktree
- transplant only winning simulation diffs back into the main checkout
