---
name: mistake-book
parent: ai-tutor
description: Manage a mistake book (record, categorize, review). Use when a user wants to log a wrong answer, organize their mistake book, review by subject/type, schedule periodic review, or export it. Outputs: structured records + tags + review reminders. / 错题本管理（记录、归类、回顾）。当用户想登记一道错题、整理错题本、按学科/题型回顾、做周期性复习、或导出错题本时使用。产物：结构化错题记录 + 归类标签 + 复习提醒。
---

# 错题本管理（mistake-book）

错题本不是「抄题目」，而是「把一道做错的题变成一条可检索、可复习的知识卡」。本子技能负责把错题可持续地沉淀下来，并在合适的时间提醒回顾。

## 适用范围
- 用户要「记一道错题」「把我刚错的题收进错题本」
- 用户要「整理 / 归类 / 查看我的错题本」
- 用户要「按学科 / 题型 / 错因复习错题」
- 用户要「导出错题本」

## 记录流程（登记一道错题）

### 第 1 步：收集信息
- **题目原文**（必要）
- **错误答案 / 错误过程**（必要）
- **正确解法**（必要，可复用 `explain-mistake` 的讲解结果）
- **学科 / 年级**（用于归类）
- **错因类型**（自动判定，见下述分类）
- **重要度**（高/中/低：是否高频考点、是否反复错）

### 第 2 步：结构化成一条记录
一条错题记录应至少包含：
```
- 学科 / 章节
- 题目（题干原文）
- 我的错误答案
- 正确答案
- 错因类型（概念型 / 公式型 / 运算型 / 思路型 / 审题型）
- 关键知识点（1-3 个标签）
- 重要度（高 / 中 / 低）
- 记录日期
```

### 第 3 步：归类与打标签
- 按**学科** + **章节/知识点**两级归类
- 给每条记录打 1-3 个知识点标签，方便日后检索
- 同一知识点反复错 → 标记为「高频易错」，重要度升级

### 第 4 步：持久化并进入复习闭环
用脚本将记录写入 `data/mistake-book.json`，并自动纳入遗忘曲线调度：
```bash
node scripts/review-cycle.mjs add \
    --subject <学科> --chapter <章节> --title "<题干原文>" \
    --mistake "<错误做法>" --answer "<正确解法>" \
    --type <错因类型> --tags "<知识点,知识点>" --importance <高|中|低>
```
> 脚本会为它自动计算首次复习日期并写入掌握状态字段（`nextDue` / `intervalIdx` / `mastery`）。

## 回顾流程（复习错题）

### 按需复习
- 用户指定范围（学科 / 题型 / 错因 / 重要度）时，抽取对应错题
- 一条错误 ≥ 2 次时，优先放在最前面

### 周期复习（遗忘曲线）
遗忘曲线的调度由脚本 `scripts/review-cycle.mjs` 实际驱动（数据存于 `data/mistake-book.json`），按「第 1 天 → 第 3 天 → 第 7 天 → 第 15 天 → 第 30 天」自动计算每次复习日期：

```bash
node scripts/review-cycle.mjs due          # 今天到期待复习的错题
node scripts/review-cycle.mjs card <id>    # 出一张复习卡（遮答案独立重做）
node scripts/review-cycle.mjs done <id> --result correct   # 做对 → 间隔升一级
node scripts/review-cycle.mjs done <id> --result wrong     # 做错 → 间隔重置，回 explain-mistake
```

复习规则（脚本内置状态机）：
- 每次复习先遮答案让学生**独立重做**
- 做对 → 间隔升一级（1→3→7→15→30 天）
- 做错 → 间隔重置为 1 天，并重新走 `explain-mistake`
- 连续做对 5 次 → 自动标记「已掌握」，脚本不再安排复习（降频）

> 由脚本负责「何时该复习」，AI 只需在复习时调用 `card` 出题、根据学生自评调用 `done` 推进，不需要靠记忆推算间隔。

## 输出模板

**登记成功时**
```
【已收录】第 N 条 · <学科>/<章节>
题目：<题干摘要>
我的错因：<错因类型> · <一句话>
关键知识点：<标签1>、<标签2>
重要度：<高/中/低>
（已归类到 <学科>/<章节>，纳入遗忘曲线复习计划）
```

**回顾时**
```
【错题回顾 · <范围>】
共 X 条，按重要度排序：
1. <学科>/<章节> · <题干摘要>（错因：<类型> · 关键：<标签>）
2. ...

【复习建议】
先从重要度「高」、频次「≥2」的开始，遮住答案独立重做。
做完发我答案，我帮你核对并更新掌握状态。
```

## 说明
- 遗忘曲线闭环的核心脚本是 `scripts/review-cycle.mjs`（`add / due / card / done / list / stats / rm`），数据存于 `data/mistake-book.json`。
- 另有简易版 `scripts/mistake-book.mjs`（`add / list / get / rm / stats`）可做轻量记录，二者共用同一数据文件。
- 若用户有本地存储偏好（如 Markdown 文件、Notion、Obsidian），可在脚本输出基础上导出。
- 错题的「讲解」部分由 `explain-mistake` 完成，本子技能只负责沉淀、归类与回顾调度。