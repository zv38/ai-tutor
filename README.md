# AI 学习助教（ai-tutor）

> **An AI learning tutor skill pack**: explain mistakes, teach concepts, plan study, quiz, and review with a forgetting-curve-driven mistake book. Works with Claude Code / Cursor / any agent that supports Agent Skills.

一个给 AI 代理使用的「学习助教」技能包（Skill Pack）。它把「怎么把一个知识点讲清楚、怎么帮学生把错题真正弄懂」的方法论固化下来，让 AI 在任何对话里都能像一位耐心的私教一样教学。

## 演示 Demo

点一个病例，AI 先诊断错因，再分步讲清正确思路，同时把涉及的知识点**点亮到错题地图**，并记录进错题本与遗忘曲线：

![演示 Demo](./demo.gif)

> 原型页：`demo/index.html`（纯静态、单文件，双击即可打开）。未配置模型时使用内置病例演示；右上角齿轮可接入你自己的 OpenAI 兼容模型获得真实讲解。

## 它能做什么

| 子技能 | 用途 | 指令文件 |
|---|---|---|
| `explain-mistake` | 错题讲解：定位错因 → 分步讲解 → 同类题 | `skills/explain-mistake/SKILL.md` |
| `explain-concept` | 知识点 / 概念分步讲解 | `skills/explain-concept/SKILL.md` |
| `review-plan` | 学习计划 / 复习安排生成 | `skills/review-plan/SKILL.md` |
| `quiz` | 测验 / 巩固题生成与批改 | `skills/quiz/SKILL.md` |
| `mistake-book` | 错题本管理（记录、归类、回顾） | `skills/mistake-book/SKILL.md` |

## 不是提示词，是一套可调用数据链

除了教学方法论，本技能还带一个可运行的 CLI（`scripts/review-cycle.mjs`），把「讲解 → 记录 → 遗忘曲线调度 → 到期复习 → 掌握」真正闭环，复习日期由脚本按 **1 / 3 / 7 / 15 / 30 天**计算，AI 无需靠记忆安排。

```bash
# 1) 对一道错题完成讲解后，登记入库并自动安排首次复习
node scripts/review-cycle.mjs add \
    --subject 数学 --chapter 二次函数 --title "含参二次函数最值" \
    --mistake "忘记讨论对称轴与区间关系" \
    --answer "分三种：轴在区间外/内/跨界，分别取端点法或顶点法" \
    --type 思路型 --tags "数形结合,分类讨论" --importance high
# → 已收录第 1 条错题（数学/二次函数）。下次复习：2026-08-17（1 天后）。

# 2) 到复习日，查出今天到期的题
node scripts/review-cycle.mjs due
# → [2026-08-17] 有 1 条到期需复习：
#     [#1] 数学/二次函数 | 含参二次函数最值 | 复习中 | 连续做对:0

# 3) 出复习卡，遮答案让学生独立重做
node scripts/review-cycle.mjs card 1

# 4) 按自评推进状态机：做对→间隔升一级；做错→重置间隔
node scripts/review-cycle.mjs done 1 --result correct   # 间隔升至 3 天
node scripts/review-cycle.mjs done 1 --result correct   # 7 天 → 15 → 30 → 已掌握
#    连续做对 5 次后判定「已掌握」，自动停止安排复习（降频）

# 5) 汇总掌握情况
node scripts/review-cycle.mjs stats
```

> 选择 `data/mistake-book.json` 作为数据库，两个脚本共用一份数据，可随时 `due` 查询到期复习、`list`/`stats` 掌握进度。

## 核心教学原则

1. **先诊断，再开药**：不直接怼答案，先确认卡点。
2. **分步推进**：难点拆成 3-5 个可理解的小步，讲清「为什么」。
3. **用学生能懂的话**：多用类比、图示、生活例子。
4. **讲思路而非套路**：给判断方法，不只给答案。
5. **主动查漏**：讲完指出易错点，让学生复述确认。
6. **鼓励但不灌水**：夸具体进步，温和纠正错误。

## 目录结构

```
ai-tutor/
├── SKILL.md                    # 主入口：整体定位、触发条件、教学原则、子技能总览
├── skills/
│   ├── explain-mistake/SKILL.md
│   ├── explain-concept/SKILL.md
│   ├── review-plan/SKILL.md
│   ├── quiz/SKILL.md
│   └── mistake-book/SKILL.md
├── scripts/
│   ├── review-cycle.mjs        # 数据链核心：add/due/card/done/list/stats/rm（遗忘曲线状态机）
│   ├── parse-image.mjs         # 图片 / 文件解析（可选 OCR）
│   └── mistake-book.mjs        # 错题本轻量存储（增/查/删/统计，与 review-cycle 共用数据）
├── data/                       # 本地学习数据（错题本等），默认不入库
└── LICENSE                     # MIT
```

## 使用方式

把本技能包放入 AI 代理可访问的技能目录（如 Claude Agent Skills、Cursor Rules 或自定义 Agent 的 skills 目录），当用户发出学习相关请求时，代理会自动匹配并调用对应子技能。

## 辅助脚本

```bash
# 数据链核心（遗忘曲线 + 掌握状态机，推荐）
node scripts/review-cycle.mjs schedule
node scripts/review-cycle.mjs add --subject 数学 --chapter 二次函数 --title "..." --mistake "..." --answer "..." --type 思路型 --tags "二次函数,判别式" --importance high
node scripts/review-cycle.mjs due --subject 数学
node scripts/review-cycle.mjs card 1
node scripts/review-cycle.mjs done 1 --result correct
node scripts/review-cycle.mjs list / stats / rm 1

# 解析错题图片（可选 OCR）
node scripts/parse-image.mjs ./a.png

# 错题本轻量版（与 review-cycle 共用数据）
node scripts/mistake-book.mjs add --subject 数学 --chapter 二次函数 --title "..." --mistake "..." --answer "..." --type 思路型 --tags "二次函数,判别式" --importance high
node scripts/mistake-book.mjs list --subject 数学 / get 1 / rm 1 / stats
```

## 许可

[MIT](./LICENSE)