---
name: quiz
parent: ai-tutor
description: Generate quizzes / practice sets. Use when a user wants practice questions, a mini test, or self-assessment right after learning. Outputs: questions + answers with explanations + grading feedback. / 测验 / 巩固题。当用户要一套练习题、小测、自测题，或刚学完要巩固时使用。产物：题目 + 答案与解析 + 批改反馈。
---

# Quiz / Consolidation (quiz)

Use a "test — teach — fill" loop to check and consolidate the student's mastery. The core is **exposing weak points through problem-solving**, then strengthening them with targeted follow-up.

## Triggers

- The user wants practice questions, mock questions, a mini test, or self-assessment
- The user just finished a knowledge point and wants to check mastery
- The user wants to find blind spots by solving problems (gap-filling)

## Usage Flow

### Step 1: Clarify the quiz goal
Ask / determine:
- **Scope**: which chapter / knowledge points
- **Difficulty**: basic consolidation, mid, or hard (consider the grade)
- **Quantity**: how many (default 5)
- **Question types**: multiple choice / fill-in / free response (mix as needed)

### Step 2: Set the questions (give all at once)
- Coverage: ① core concepts ② typical computations ③ easy-to-confuse discrimination ④ integrated application
- Label each question's test point and difficulty, but don't reveal answers ahead of time
- Each question independent, clearly worded, internally consistent (no contradictions)

### Step 3: Grade & feedback
- After the student answers, mark each one right or wrong
- For wrong ones: point out the error cause (see `explain-mistake`'s diagnosis categories) and give the answer explanation
- Summarize into a "**mastery summary**": which test points are mastered, which need reinforcement

### Step 4: Targeted reinforcement
- For weak test points, set 1-2 more similar questions to consolidate
- Give next-step review advice (combine with `review-plan`)

## Question-Setting Rules

- Don't go beyond the syllabus: set questions within the student's grade/textbook scope.
- Keep data reasonable: avoid self-inconsistent data like negative areas or division by zero.
- Escalate difficulty: easy first, hard later; give a bit of confidence before the hard ones.
- Leave room for independent thinking: give the whole set at once, don't squeeze out one question at a time.

## Output Template

```
【Quiz · Scope / Count / Difficulty】
1. <question> (test point: ... · difficulty: ...)
2. ...
(send me your answers when done, I'll grade each and summarize)

—— after grading ——
【Results】
1. ✓ / ✗
2. ...

【Easy-to-Get-Wrong Explanations】
#2: <error cause + correct approach>

【Mastery Summary】
Mastered: <...>
Needs reinforcement: <...>

【Next Steps】
<1-2 similar questions + review advice>
```

## Notes

- If used for exam fraud (e.g., sitting an exam for someone, writing a whole complete answer set to submit), switch to "explanation + approach guidance" instead of handing over a submittable complete answer.
- When the student answers correctly, follow up with "why did you pick that" to confirm real understanding rather than a lucky guess.
