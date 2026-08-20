---
name: review-plan
parent: ai-tutor
description: Create study / review plans. Use when a user wants a study plan, review schedule, or exam-cram timeline. Outputs: day/week-by-week plan + priorities + review checkpoints. / 学习计划 / 复习安排。当用户要一份学习计划、复习计划、考前冲刺安排、To-Do 时使用。产物：分日/分周计划 + 优先级 + 复盘节点。
---

# Study Plan (review-plan)

Turn "I want to study" into an **executable schedule**. The core is **goal breakdown + time allocation + regular review**, so the plan doesn't become just a pretty table.

## Triggers

- The user wants a "study plan / review schedule / exam-cram / what to study each week"
- The user says "I'm short on time, how should I arrange it" / "how do I review for finals"
- The user wants to build a long-term study habit

## Planning Flow

### Step 1: Gather the needed info
- **Goal**: what exam to prepare for / what to achieve (e.g., "score 90 on the math final", "master quadratic functions")
- **Time**: how long until the goal; how much time per day can be committed
- **Current state**: current level, strong/weak subjects or chapters, what's already learned
- **Format preference**: fixed daily time, or a task checklist

> If info is missing, ask first; don't assume things like "2 hours a day".

### Step 2: Break down the goal (large → small)
- Split the overall goal into "phase → week → day" three layers
- Give each layer a **quantifiable** sub-goal (e.g., "redo the mistakes of 3 past papers this week")

### Step 3: Allocate time & priority
- Arrange by "weak spots first + forgetting curve": shore up the weak areas first, then consolidate what's understood
- Label each block with priority (high / mid / low)
- Reserve time for review and reflection; don't fill the schedule to the brim
- **Base review tasks on the mistakes actually due today** — check the day's due items first, then build the plan:
  ```bash
  node scripts/review-cycle.mjs due                  # mistakes due today
  node scripts/review-cycle.mjs due --subject Math   # Math only
  ```
  > "Review" in the plan isn't added casually — it's the due items actually listed by `due`, so the review schedule stays anchored to real mistakes.

### Step 4: Generate the plan table
Give a clear day/week-by-week task table, annotated with:
- Each day: specific task + estimated time + priority
- Each week: one review point (what was learned, what's unclear, next-week adjustments)

### Step 5: Reflect & adjust
- Teach the student a simple reflection method (e.g., daily 3 questions: what did I learn today / where am I stuck / what will I do tomorrow)
- Make clear the plan is flexible: fine-tune weekly based on reality

## Output Template

```
【Goal】<...>
【Time】<X days to goal · ~Y hours/day>

【Phase Breakdown】
Phase 1 (days 1-3): ...
Phase 2 (days 4-7): ...

【This Week / Daily Plan】
(table: date | task | time | priority)

【Review Point】
Every week X: do a <restate/quiz>, note sticking points, adjust next week.

【Advice for the Student】
- Weak spots first: focus on <chapter>
- Keep buffer: don't fill everything; leave 20% flexibility
```

## Notes

- The plan must be **executable** — better fewer but accurate than many but empty.
- Combine with the subject's forgetting pattern: arrange a "teach → practice → next-day restate" rhythm.
- If the user's goal is vague, first help them define a specific, measurable goal.
