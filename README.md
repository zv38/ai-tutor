# ai-tutor — AI Learning Tutor Skill Pack

> **An AI learning tutor skill pack**: explains mistakes, teaches concepts, plans study, quizzes, and reviews with a forgetting-curve-driven mistake book. Works with Claude Code, Cursor, and any agent that supports Agent Skills.

ai-tutor turns "how to explain a concept clearly" and "how to help a student truly master a wrong answer" into a **reusable skill pack**. In any AI-agent conversation, it behaves like a patient private tutor.

## Live Demo

Pick a case; the AI first diagnoses the root cause, then explains the correct approach step by step while **lighting up the involved knowledge points on the mistake map**, and logs the entry into the mistake book with forgetting-curve review:

![Live Demo](./demo.gif)

> Prototype page: `demo/index.html` (pure static, single file, double-click to open). It runs built-in cases when no model is configured; open the gear in the top-right to connect your own OpenAI-compatible model for real explanations.

## What It Does

| Sub-skill | Purpose | Instruction file |
|---|---|---|
| `explain-mistake` | Explain mistakes: locate the error → step-by-step fix → similar practice | `skills/explain-mistake/SKILL.md` |
| `explain-concept` | Explain concepts / knowledge points step by step | `skills/explain-concept/SKILL.md` |
| `review-plan` | Build study plans / review schedules | `skills/review-plan/SKILL.md` |
| `quiz` | Generate & grade quizzes / practice sets | `skills/quiz/SKILL.md` |
| `mistake-book` | Manage the mistake book (record, categorize, review) | `skills/mistake-book/SKILL.md` |

## Not Just Prompts — A Runnable Data Chain

Beyond teaching methodology, this skill ships a working CLI (`scripts/review-cycle.mjs`) that closes the loop of **explain → record → forgetting-curve scheduling → due review → mastery**. Review dates are computed by the script on a **1 / 3 / 7 / 15 / 30 day** schedule — the AI never has to guess.

```bash
# 1) After explaining a mistake, log it and schedule its first review
node scripts/review-cycle.mjs add \
    --subject Math --chapter "Quadratic Functions" --title "Extreme value of a parameterized quadratic" \
    --mistake "Forgot to discuss the relation between the axis of symmetry and the interval" \
    --answer "Split into three cases: axis outside/inside/crossing the interval; use endpoint or vertex method" \
    --type "reasoning" --tags "graph-and-numbers,case-analysis" --importance high
# → Recorded mistake #1 (Math/Quadratic Functions). Next review: 2026-08-17 (1 day later).

# 2) On review day, list what's due today
node scripts/review-cycle.mjs due
# → [2026-08-17] 1 mistake(s) due for review:
#     [#1] Math/Quadratic Functions | Extreme value of a parameterized quadratic | reviewing | streak:0

# 3) Draw a review card (hide the answer so the student redoes it independently)
node scripts/review-cycle.mjs card 1

# 4) Advance the state machine by self-evaluation: correct → bump interval; wrong → reset
node scripts/review-cycle.mjs done 1 --result correct   # interval up to 3 days
node scripts/review-cycle.mjs done 1 --result correct   # 7 → 15 → 30 → mastered
#    After 5 consecutive correct reviews it is marked "mastered" and auto-downgraded.

# 5) Summarize mastery
node scripts/review-cycle.mjs stats
```

> `data/mistake-book.json` is the database; both scripts share the same data file. Query due reviews with `due` anytime, and check mastery progress with `list` / `stats`.

## Core Teaching Principles

1. **Diagnose before prescribing** — don't jump to the answer; confirm where the student is stuck.
2. **Step by step** — break a hard point into 3–5 understandable steps, and explain the "why".
3. **Speak the student's language** — favor analogies, diagrams, and real-life examples.
4. **Teach the approach, not the routine** — give the judgment method, not just the answer.
5. **Proactively check for gaps** — point out common traps and have the student restate to confirm.
6. **Encourage without fluff** — praise specific progress and correct mistakes gently.

## Directory Structure

```
ai-tutor/
├── SKILL.md                    # Main entry: positioning, triggers, teaching principles, sub-skill overview
├── skills/
│   ├── explain-mistake/SKILL.md
│   ├── explain-concept/SKILL.md
│   ├── review-plan/SKILL.md
│   ├── quiz/SKILL.md
│   └── mistake-book/SKILL.md
├── scripts/
│   ├── review-cycle.mjs        # Data-chain core: add/due/card/done/list/stats/rm (forgetting-curve state machine)
│   ├── plot.mjs                # Coordinate plotting for math: functions, curves, polygons (数形结合)
│   ├── parse-image.mjs         # Image / file parsing (optional OCR)
│   └── mistake-book.mjs        # Lightweight mistake-book storage (shares data with review-cycle)
├── data/                       # Local learning data (mistake book etc.), git-ignored by default
└── LICENSE                     # MIT
```

## Quick Start (Claude Code · Recommended)

ai-tutor is a set of Agent Skills designed for **Claude Code**. After install, Claude auto-detects your study requests in conversation and calls the matching sub-skill. No configuration needed.

### Step 1: One-command install

From the repo root of `ai-tutor`:

```bash
# macOS / Linux
bash install.sh

# Windows
install.cmd
```

This installs the skill pack to `~/.claude/skills/ai-tutor/` (user-level, available in all projects). Add `--project` to install only in the current project; add `--uninstall` to remove.

> Manual install works too: copy this entire folder to `~/.claude/skills/ai-tutor/`. Same effect.

### Step 2: Start learning

Launch Claude Code in any directory and just talk in natural language:

| You say | Sub-skill triggered |
|---|---|
| "Explain why I got this math problem wrong" | `explain-mistake` |
| "How do I understand the axis of symmetry of a quadratic?" | `explain-concept` |
| "Give me some chemistry problems to practice" | `quiz` |
| "Make me a one-week review plan" | `review-plan` |
| "Log this problem in my mistake book and schedule a review" | `mistake-book` |

During explanations, the AI auto-logs wrong answers into your local mistake book and schedules forgetting-curve reviews, reminding you when reviews come due.

### Step 3 (optional): Drive the review loop

Reviews are computed by the script; the AI calls it for you, or you can drive it manually with commands (see "Helper Scripts" below).

## Compatibility

- **Claude Code (Agent Skills)**: ⭐ officially recommended. `~/.claude/skills/` is natively supported; best experience.
- **Cursor / other agents supporting Skills**: ai-tutor's `SKILL.md` is a standard Agent Skill structure and can be dropped into the corresponding skill directory. Triggering and configuration vary by tool — see each tool's skill docs.
- **Standalone (no agent)**: `scripts/` commands run in a plain Node.js environment for mistake-book management; but "explain / quiz / plan" abilities require an AI model and cannot run offline.

## Helper Scripts

```bash
# Data-chain core (forgetting curve + mastery state machine + subject dimensions, recommended)
node scripts/review-cycle.mjs schedule
node scripts/review-cycle.mjs dimensions --subject Math      # view knowledge/difficulty/question-type skeleton
node scripts/review-cycle.mjs add --subject Math --knowledge "Quadratic Functions" --difficulty mid --qtype calculation --title "..." --mistake "..." --answer "..." --type reasoning --tags "quadratic,discriminant" --importance high
node scripts/review-cycle.mjs due --subject Math
node scripts/review-cycle.mjs card 1
node scripts/review-cycle.mjs done 1 --result correct --exam # closed-book regrade for objectivity; omit --exam for quick self-eval
node scripts/review-cycle.mjs list --subject Math --difficulty hard
node scripts/review-cycle.mjs stats / rm 1

# Math visualization: plot when explaining functions/geometry (数形结合)
node scripts/plot.mjs fn --fn "-(x^2)+4x"             # quadratic y=-x²+4x
node scripts/plot.mjs impl --impl "x^2+y^2-9"         # circle of radius 3
node scripts/plot.mjs pts --pts "0,0 4,0 4,3" --svg ./img/triangle.svg  # right triangle + export SVG

# Parse a mistake image (optional OCR)
node scripts/parse-image.mjs ./a.png

# Lightweight mistake book (shares data with review-cycle)
node scripts/mistake-book.mjs add --subject Math --chapter "Quadratic Functions" --title "..." --mistake "..." --answer "..." --type reasoning --tags "quadratic,discriminant" --importance high
node scripts/mistake-book.mjs list --subject Math / get 1 / rm 1 / stats
```

## License

Open-sourced under the [MIT License](./LICENSE). You are free to use, modify, distribute, and commercialize, provided you retain the copyright and license notices.

## Third-Party Dependencies

The scripts use only the Node.js standard library — **no third-party runtime dependencies**, ready to run out of the box.
