# Contributing to ai-tutor

Thank you for wanting to contribute to ai-tutor! The goal of this skill pack is to make AI a better learning tutor. Any improvement that makes teaching clearer, covers more subjects, or makes the data chain more reliable is welcome.

## Project Structure

```
ai-tutor/
├── SKILL.md                    # Main entry: positioning, triggers, teaching principles, sub-skill overview
├── skills/
│   └── <skill-name>/SKILL.md   # One directory per sub-skill
├── scripts/
│   ├── review-cycle.mjs        # Forgetting curve + mastery state machine (add/due/card/done/list/stats/rm)
│   ├── plot.mjs                # Coordinate plotting for math (functions/curves/polygons)
│   ├── parse-image.mjs         # Image / file parsing (optional OCR)
│   └── mistake-book.mjs        # Lightweight mistake-book storage (shares data with review-cycle)
├── data/                       # Local learning data (git-ignored by default)
└── LICENSE                     # MIT
```

## Adding or Modifying a Sub-skill

Each sub-skill is an independent `SKILL.md`; its frontmatter must follow this spec:

```yaml
---
name: <skill-name>              # lowercase, hyphen-separated
parent: ai-tutor                # always ai-tutor
description: <English description>. Use when ... / <中文描述>。当用户...时使用。
---
```

- `description` should be **bilingual**: English first (for English-language directory indexing), and include a clear trigger scenario.
- Body content is organized as "trigger scenarios → workflow steps → outputs → notes", following the 6 core teaching principles in the main `SKILL.md`.
- For features that need persistence / review scheduling, reuse `scripts/review-cycle.mjs` rather than inventing a new data format.
- When adding a script, also register it in the directory-structure and command tables of `README.md`.

## Local Verification

The skill pack is mostly Markdown + Node.js scripts. Before submitting, please:

1. Check frontmatter and table rendering with any Markdown previewer.
2. If a script changed, run `node scripts/review-cycle.mjs --help` or the relevant command to verify there are no syntax errors.
3. Confirm local data under `data/` is not committed (it should be excluded in `.gitignore`).

## Commit Message Conventions

Use Conventional Commits, in English:

```
feat: add an English reading-question sub-skill
fix: fix forgetting-curve date drift across leap years
docs: add demo instructions
chore: bump version
```

## PR Process

1. Create a branch from `main`: `git checkout -b feat/your-improvement`
2. Make changes and verify locally
3. Push the branch and open a Pull Request, explaining the motivation and how you verified the change

## Code of Conduct

Everyone participating in this project is expected to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
