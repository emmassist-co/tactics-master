# GitHub Pages Release Checklist

Use this checklist when turning `tactics-master` public and confirming the GitHub Pages demo URL for the current same-device prototype.

## Before changing visibility

- Confirm the working tree is intentional and merged to `main`.
- Confirm `LICENSE` is present and the README reflects the public hosting model.
- Review workflow files and recent Actions logs for anything you would not want visible after the repo becomes public.
- Confirm the expected demo URL is `https://emmassist-co.github.io/tactics-master/`.
- Confirm PR previews are expected at `https://emmassist-co.github.io/tactics-master/previews/pr-<PR_NUMBER>/`.

## Repository visibility change

In GitHub:

1. Open `emmassist-co/tactics-master`.
2. Go to `Settings`.
3. Open the `Danger Zone`.
4. Use `Change repository visibility`.
5. Choose `Make public` and complete GitHub's confirmation flow.

Public-side effects to acknowledge:

- The code becomes visible to everyone.
- Anyone can fork the repository.
- Existing GitHub Actions history and logs become visible to everyone.

## GitHub Pages settings

After the repo is public:

1. Open `Settings` -> `Pages`.
2. Confirm the site is publishing from the intended source.
3. If using branch deployment, confirm the source branch is `gh-pages`.
4. Confirm the demo site resolves under `/tactics-master/`, not `/`.
5. If a custom domain is added later, document it in the README and verify DNS/HTTPS there.

## Smoke checks

- Wait for the latest `Preview Deploy` workflow on `main` to succeed.
- Open `https://emmassist-co.github.io/tactics-master/`.
- Confirm the app loads without broken asset paths.
- Confirm the demo behaves like the current same-device prototype, not a networked multiplayer flow.
- Start a local match flow in the browser and confirm the main screens render.
- Open one recent PR preview URL and confirm it still loads under `/tactics-master/previews/pr-<PR_NUMBER>/`.

## Local verification before or after cutover

```bash
npm test -- --runInBand
npm run build
PREVIEW_BASE_PATH=/tactics-master/ pnpm build
PREVIEW_BASE_PATH=/tactics-master/previews/pr-123/ pnpm build
python3 /Users/alexandre/.codex/skills/os-ready/scripts/os_ready_audit.py --root "$PWD"
```
