# tactics-master

## Working style

- Be sharp, short, and explicit.
- Prefer small, inspectable changes over broad rewrites.
- Ask before heavy refactors or paradigm shifts.
- Prefer clear, easy-to-reason code over backward compatibility unless requested.
- Avoid touching large generated artifacts unless asked.

## Repo state

- This repo is currently being initialized.
- Favor simple bootstrap choices that are easy to replace once the product shape is clearer.
- Do not invent stack-specific commands, folders, or workflows until they exist in the repo.

## Source of truth

- Treat root docs as canonical once present: `README.md`, `STRATEGY.md`, and this file.
- Keep product direction in `STRATEGY.md`.
- Keep implementation details in code or focused docs near the relevant code.

## Verification

- Run the smallest relevant verification that proves the slice works.
- Do not call work done based only on code edits.
- Distinguish clearly between implemented and verified.
- If no runnable verification exists yet, say that explicitly and avoid overstating completion.

## Skills

- If a task clearly maps to a skill, open the skill and follow it.
- Prefer repo-local skills over personal global skills when both could apply.
- Keep global skills focused on general engineering work unless the task explicitly calls for a specialty workflow.

## Change discipline

- Preserve user changes you did not make.
- Do not introduce broad scaffolding unless it directly supports the current task.
- When the repo is still forming, choose conventions that keep future replacement cheap.
