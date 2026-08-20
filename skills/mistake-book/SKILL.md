---
name: mistake-book
parent: ai-tutor
description: Manage a mistake book (record, categorize, review). Use when a user wants to log a wrong answer, organize their mistake book, review by subject/type, schedule periodic review, or export it. Outputs: structured records + tags + review reminders. / 错题本管理（记录、归类、回顾）。当用户想登记一道错题、整理错题本、按学科/题型回顾、做周期性复习、或导出错题本时使用。产物：结构化错题记录 + 归类标签 + 复习提醒。
---

# Mistake Book (mistake-book)

A mistake book is not "copying the question" — it's **turning a wrong answer into a searchable, reviewable knowledge card**. This sub-skill sustains mistake accumulation and reminds the student to review at the right time.

## Scope
- The user wants to "log a mistake" / "put the problem I just got wrong into my mistake book"
- The user wants to "organize / categorize / view my mistake book"
- The user wants to "review mistakes by subject / question type / error cause"
- The user wants to "export the mistake book"

## Recording Flow (log one mistake)

### Step 1: Gather info
- **Question text** (required)
- **Wrong answer / wrong process** (required)
- **Correct solution** (required; can reuse the result from `explain-mistake`)
- **Subject / grade** (for categorization)
- **Error type** (auto-determined; see the categories below)
- **Importance** (high/mid/low: is it a frequently-tested point, does it keep recurring)

### Step 2: Structure into one record
A mistake record should contain at least:
```
- Subject / chapter
- Question (original text)
- My wrong answer
- Correct answer
- Error type (conceptual / formula / arithmetic / reasoning / reading)
- Key knowledge points (1-3 tags)
- Importance (high / mid / low)
- Date recorded
```

### Step 3: Categorize & tag
- Categorize by **subject** + **chapter/knowledge point** (two levels)
- Tag each record with 1-3 knowledge-point tags for future search
- If the same knowledge point recurs → mark it "frequently missed", upgrade importance

### Step 4: Persist and enter the review loop
Write the record into `data/mistake-book.json` with the script, auto-entering the forgetting-curve schedule:
```bash
node scripts/review-cycle.mjs add \
    --subject <subject> --chapter <chapter> --title "<question text>" \
    --mistake "<wrong approach>" --answer "<correct solution>" \
    --type <error type> --tags "<knowledge,knowledge>" --importance <high|mid|low>
```
> The script auto-computes the first review date and writes the mastery-state fields (`nextDue` / `intervalIdx` / `mastery`).

## Review Flow (review mistakes)

### On-demand review
- When the user specifies a scope (subject / question type / error cause / importance), pull the matching mistakes
- An item wrong ≥ 2 times goes to the front of the list

### Periodic review (forgetting curve)
The forgetting-curve schedule is actually driven by the script `scripts/review-cycle.mjs` (data in `data/mistake-book.json`), which auto-computes each review date on "day 1 → day 3 → day 7 → day 15 → day 30":

```bash
node scripts/review-cycle.mjs due          # mistakes due for review today
node scripts/review-cycle.mjs card <id>    # draw a review card (hide answer, redo independently)
node scripts/review-cycle.mjs done <id> --result correct   # correct → bump interval one level
node scripts/review-cycle.mjs done <id> --result wrong     # wrong → reset interval, back to explain-mistake
```

Review rules (built-in script state machine):
- Each review first hides the answer and has the student **redo it independently**
- Correct → bump the interval one level (1→3→7→15→30 days)
- Wrong → reset the interval to 1 day and re-run `explain-mistake`
- 5 consecutive correct → auto-mark "mastered"; the script stops scheduling it (downgrade)

> The script handles "when to review"; the AI just calls `card` to draw a question at review time and `done` to advance based on the student's self-evaluation — no need to compute intervals from memory.

## Output Template

**On successful logging**
```
【Logged】#N · <subject>/<chapter>
Question: <question summary>
My error: <error type> · <one sentence>
Key knowledge points: <tag1>, <tag2>
Importance: <high/mid/low>
(logged under <subject>/<chapter>, entered the forgetting-curve review plan)
```

**On review**
```
【Mistake Review · <scope>】
X item(s), sorted by importance:
1. <subject>/<chapter> · <question summary> (error: <type> · key: <tag>)
2. ...

【Review Advice】
Start with importance "high" and frequency "≥2"; hide the answer and redo independently.
Send me your answers when done — I'll check and update the mastery status.
```

## Notes
- The core script of the forgetting-curve loop is `scripts/review-cycle.mjs` (`add / due / card / done / list / stats / rm`), data in `data/mistake-book.json`.
- A lightweight `scripts/mistake-book.mjs` (`add / list / get / rm / stats`) can do simple logging; both share the same data file.
- If the user prefers local storage (e.g., Markdown files, Notion, Obsidian), export on top of the script output.
- The "explanation" part of a mistake is done by `explain-mistake`; this sub-skill only handles accumulation, categorization, and review scheduling.
