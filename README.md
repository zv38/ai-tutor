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

## 快速上手（Claude Code · 推荐）

ai-tutor 是给 **Claude Code** 设计的一套 Agent Skills。安装后，Claude 会在对话中自动识别你的学习请求并调用对应子技能。你无需任何配置。

### 第 1 步：一键安装

在 `ai-tutor` 仓库根目录运行：

```bash
# macOS / Linux
bash install.sh

# Windows
install.cmd
```

这会把这个技能包装到 `~/.claude/skills/ai-tutor/`（用户级，所有项目可用）。想只在当前项目用，加 `--project`；想卸载，加 `--uninstall`。

> 你也可以手动安装：把本仓库整个文件夹复制到 `~/.claude/skills/ai-tutor/` 即可，效果一样。

### 第 2 步：开始学习

在任意目录启动 Claude Code，直接用自然语言对话即可：

| 你说的话 | 会触发的子技能 |
|---|---|
| "帮我讲讲这道数学题为什么错了" | `explain-mistake` 错题讲解 |
| "二次函数对称轴怎么理解？" | `explain-concept` 知识点讲解 |
| "帮我做几道化学题巩固一下" | `quiz` 测验 |
| "列一份一周的复习计划" | `review-plan` 学习计划 |
| "把这题记进错题本，安排复习" | `mistake-book` 错题本 |

讲解过程中，AI 会自动把错题写入本机错题本并安排遗忘曲线复习，到期主动提醒你复习。

### 第 3 步（可选）：驱动复习闭环

复习由脚本计算，AI 调用即可，你也可以手动用命令推进（见下方"辅助脚本"）。

## 兼容性说明

- **Claude Code（Agent Skills）**：⭐ 官方推荐，`~/.claude/skills/` 是原生支持，体验最佳。
- **Cursor / 其他支持 Skills 的 Agent**：ai-tutor 的 `SKILL.md` 是标准 Agent Skill 结构，同样可以放入对应技能目录，但触发与配置方式因工具而异，请参考各工具的技能接入文档。
- **独立使用（不依赖 AI 代理）**：`scripts/` 下的命令可在纯 Node.js 环境独立运行，用于错题本管理；但"讲解、出题、规划"类能力依赖 AI 模型，无法离线提供。

## 辅助脚本

```bash
# 数据链核心（遗忘曲线 + 掌握状态机 + 学科维度，推荐）
node scripts/review-cycle.mjs schedule
node scripts/review-cycle.mjs dimensions --subject 数学      # 查看该学科的知识点/难度/题型骨架
node scripts/review-cycle.mjs add --subject 数学 --knowledge 二次函数 --difficulty 中 --qtype 计算 --title "..." --mistake "..." --answer "..." --type 思路型 --tags "二次函数,判别式" --importance high
node scripts/review-cycle.mjs due --subject 数学
node scripts/review-cycle.mjs card 1
node scripts/review-cycle.mjs done 1 --result correct --exam # 闭卷重做判分（客观性更高）；快速自评省略 --exam
node scripts/review-cycle.mjs list --subject 数学 --difficulty 难
node scripts/review-cycle.mjs stats / rm 1

# 解析错题图片（可选 OCR）
node scripts/parse-image.mjs ./a.png

# 数学可视化：讲函数/几何时画图（数形结合）
node scripts/plot.mjs fn --fn "-(x^2)+4x"             # 二次函数 y=-x²+4x
node scripts/plot.mjs impl --impl "x^2+y^2-9"         # 半径 3 的圆
node scripts/plot.mjs pts --pts "0,0 4,0 4,3" --svg ./img/triangle.svg  # 直角三角形并导出SVG

# 错题本轻量版（与 review-cycle 共用数据）
node scripts/mistake-book.mjs add --subject 数学 --chapter 二次函数 --title "..." --mistake "..." --answer "..." --type 思路型 --tags "二次函数,判别式" --importance high
node scripts/mistake-book.mjs list --subject 数学 / get 1 / rm 1 / stats
```

## 许可

本项目基于 [MIT License](./LICENSE) 开源，你可以自由地使用、修改、分发和商用，但需保留版权声明和许可声明。

## 第三方依赖

本项目脚本仅使用 Node.js 标准库，**无第三方运行时依赖**，开箱即用。