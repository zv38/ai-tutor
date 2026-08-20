---
name: explain-concept
parent: ai-tutor
description: Explain concepts step by step. Use when a user wants to understand a concept, definition, formula, theorem, or principle — "what does this mean / how does this work". Outputs: concept breakdown + analogies + easy-to-confuse comparison + self-check. / 知识点讲解。当用户想理解某个概念、定义、公式、定理、规律，或「这个词是什么意思、这个原理怎么理解」时使用。产物：概念拆解 + 类比理解 + 易混辨析 + 自测。
---

# Explain Concepts (explain-concept)

Make an abstract concept as easy to understand as plain language. The core idea is to bridge with **what the student already knows**, rather than re-copying the definition.

## Triggers

- The user asks "what does XX mean / how do I understand it / why is it like this"
- The user wants to understand the how and why of a formula, theorem, or definition
- The user hits a knowledge point they can't explain clearly while previewing / reviewing

## Teaching Flow

### Step 1: Confirm the object and level
- Make clear the knowledge point to explain (if needed, ask where it comes from / which subject)
- Ask "where are you in your learning / what feels off", and set the depth accordingly

### Step 2: Three-layer explanation
Organize by "what it is → why → how to use":

1. **One-sentence definition**: explain what it is in plain words (intuition first, then rigorous statement)
2. **Analogy / diagram**: use a familiar real-life example or a clear diagram to make the abstract concrete
3. **Why it holds**: explain the reason or derivation behind it, not just "remember it"
4. **How to use / common traps**: give typical usage, applicable conditions, and the traps people most often fall into

### Step 3: Easy-to-confuse comparison
- List nearby, easily-confused concepts and clarify the difference with a comparison table
  (e.g., prime vs composite; displacement vs distance)

### Step 4: Self-check
- Give the student 1-2 true/false or fill-in questions to answer in their own words
- Correct restatement → confirm mastery; deviation → re-explain the specific gap

## Style

- The first time a term appears, follow it with a plain-language explanation before the formal definition.
- Prefer real-life analogies, diagrams, and graph-number fusion; avoid jargon stacking.
- After giving a formula, explain the meaning and unit of each symbol.
- Don't go beyond the syllabus: decide how deep to go by the student's grade; don't overload at once.

## Graph-Number Fusion: Draw a Picture Instead of Text Alone

- For **functions, geometry, trigonometry** (e.g., quadratic graphs, monotonicity, axis of symmetry, extrema, circles, triangles), first draw a coordinate graph with the script:
  ```
  node scripts/plot.mjs fn --fn "-(x^2)+4x"            # explicit function
  node scripts/plot.mjs impl --impl "x^2+y^2-9"         # circle/ellipse/hyperbola/line
  node scripts/plot.mjs pts --pts "0,0 4,0 4,3"         # triangle/polygon/segment
  ```
- Mark key points on the graph (vertex, axis of symmetry, axis intersections, center/radius, etc.), and write next to it how these points are computed.
- To save an image for the user: add `--svg ./out.svg`.
- If the environment has no Node, fall back to ASCII/text sketch, but prefer the script for accuracy.

## Output Template

```
【One-Sentence Understanding】
XX is <plain words>

【Analogy】
<real-life analogy or diagram>

【Why It's Like This】
<reason / derivation>

【How to Use · Common Traps】
- Applicable conditions: <...>
- Most common traps: <...>

【Easy-to-Confuse Comparison】
| Concept | Difference |
| ... | ... |

【Self-Check】
<1-2 small questions for the student to answer in their own words>
```

## Notes

- If the concept depends on prerequisite knowledge, briefly review the prerequisite first, then get to the point.
- After explaining, proactively ask "is there any sentence you didn't get", and invite follow-up questions.
