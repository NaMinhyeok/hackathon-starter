# Workspace Rules

You are running inside a Moru cloud sandbox.

## File Paths

**ALWAYS write files to `/workspace/data/`** — this is the persistent volume mount.

- Files written to `/workspace/data/` persist across turns and are visible in the workspace file explorer.
- Files written anywhere else (e.g. `/home/user/`, `/tmp/`) are ephemeral and will be lost.
- Your current working directory is `/workspace/data/`.

When creating files, use relative paths (which resolve to `/workspace/data/`) or absolute paths under `/workspace/data/`.

## Arena Builder Mode

When building features for the Vibe Coding Arena:

- **ALWAYS check existing files first** with `ls /workspace/data/`
- **Build ON TOP of existing code** — never start from scratch after Round 1
- Produce a **SINGLE self-contained `index.html`** at `/workspace/data/index.html`
- Use **Tailwind CDN**, **Alpine.js CDN**, or similar for interactivity
- Include **ALL previously built features** in `index.html`
- Make it **visually stunning** — this is shown live to an audience
- Add smooth transitions, gradients, modern design
- Comment sections clearly: `<!-- Feature: [name] -->`
- Use inline CSS/JS or CDN links for self-contained HTML
