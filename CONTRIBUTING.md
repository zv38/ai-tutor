# Contributing to ai-tutor

感谢你愿意为 ai-tutor 贡献！这个技能包的目标是让 AI 成为更好的学习助教，任何让教学更清晰、覆盖更多学科、数据链更可靠的改进都欢迎。

## 项目结构

```
ai-tutor/
├── SKILL.md                    # 主入口：整体定位、触发条件、教学原则、子技能总览
├── skills/
│   └── <skill-name>/SKILL.md   # 每个子技能一个目录
├── scripts/
│   ├── review-cycle.mjs        # 遗忘曲线 + 掌握状态机（add/due/card/done/list/stats/rm）
│   ├── parse-image.mjs         # 图片/文件解析（可选 OCR）
│   └── mistake-book.mjs        # 错题本轻量存储（与 review-cycle 共用数据）
├── data/                       # 本地学习数据（默认不入库）
└── LICENSE                     # MIT
```

## 新增或修改子技能

每个子技能是一个独立的 `SKILL.md`，frontmatter 需符合以下规范：

```yaml
---
name: <skill-name>              # 小写、连字符分隔
parent: ai-tutor                # 固定为 ai-tutor
description: <英文描述>。Use when ... / <中文描述>。当用户...时使用。
---
```

- `description` 建议**中英双语**，英文在前（便于英文目录收录），并包含明确的触发场景。
- 正文按「触发场景 → 工作流步骤 → 产物 → 注意事项」组织，遵循主 `SKILL.md` 的 6 条核心教学原则。
- 需要落盘/调度复习的功能，优先复用 `scripts/review-cycle.mjs`，不要另造数据格式。
- 新增脚本时在 `README.md` 的目录结构与命令表中同步登记。

## 本地验证

技能包以 Markdown + Node.js 脚本为主，提交前请：

1. 用任意 Markdown 预览器检查 frontmatter 与表格渲染正常。
2. 若改动涉及脚本，运行 `node scripts/review-cycle.mjs --help` 或对应命令验证无语法错误。
3. 确认 `data/` 下的本地数据没有被提交（应在 `.gitignore` 中排除）。

## 提交信息规范

使用 Conventional Commits，中文描述：

```
feat: 新增英语阅读题型讲解子技能
fix: 修复遗忘曲线在闰年日期计算偏差
docs: 补充演示说明
chore: 更新版本号
```

## PR 流程

1. 从 `main` 创建分支：`git checkout -b feat/your-improvement`
2. 修改并本地验证
3. 推送分支并提交 Pull Request，说明改动动机与验证方式

## 行为准则

参与本项目的所有人需遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。
