#!/usr/bin/env bash
# ============================================================
# ai-tutor 一键安装脚本
# 把本技能包安装为 Claude Agent Skills（用户级全局技能）。
# 安装后在任何目录下启动 Claude Code，即可触发 ai-tutor。
# ------------------------------------------------------------
# 用法：
#   bash install.sh            # 安装到用户级    ~/.claude/skills/ai-tutor/
#   bash install.sh --project  # 安装到项目级    ./.claude/skills/ai-tutor/
#   bash install.sh --uninstall
# ============================================================
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="ai-tutor"

# 定位目标目录
if [[ "${1:-}" == "--project" ]]; then
  DEST_DIR="$(pwd)/.claude/skills/$SKILL_NAME"
  echo "→ 目标：项目级 ${DEST_DIR}"
elif [[ "${1:-}" == "--uninstall" ]]; then
  # 尝试从两个位置移除
  for base in "$HOME/.claude/skills" "$(pwd)/.claude/skills"; do
    if [[ -d "$base/$SKILL_NAME" ]]; then
      rm -rf "$base/$SKILL_NAME"
      echo "✓ 已卸载：$base/$SKILL_NAME"
    fi
  done
  echo "完成。"
  exit 0
else
  DEST_DIR="$HOME/.claude/skills/$SKILL_NAME"
  echo "→ 目标：用户级 ${DEST_DIR}"
fi

# 校验源文件
[[ -f "$SRC_DIR/SKILL.md" ]] || { echo "✗ 未找到 SKILL.md，请确认在 ai-tutor 仓库根目录运行本脚本"; exit 1; }

# 复制（保留脚本与文档；data/ 本地数据不复制，密钥不涉及）
mkdir -p "$DEST_DIR"
cp -R "$SRC_DIR/SKILL.md" "$DEST_DIR/SKILL.md"
[[ -d "$SRC_DIR/skills" ]] && cp -R "$SRC_DIR/skills" "$DEST_DIR/skills"
[[ -d "$SRC_DIR/scripts" ]] && cp -R "$SRC_DIR/scripts" "$DEST_DIR/scripts"
# 文档/许可
for f in LICENSE README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md; do
  [[ -f "$SRC_DIR/$f" ]] && cp "$SRC_DIR/$f" "$DEST_DIR/$f"
done

echo "✓ 已安装到：$DEST_DIR"
echo ""
echo "下一步（3 步上手）："
echo "  1) 启动 Claude Code：在任意项目目录运行  claude"
echo "  2) 发一道错题：贴题/拍照发文字，说「帮我讲讲这道题怎么错了」"
echo "  3) 记入错题本复习：让 AI 用 review-cycle 登记，到期自动提醒复习"
echo ""
echo "  · 技能本质是给 Claude 的「高质量教学方法论 + 可调用脚本」"
echo "  · 错题数据存于本机 data/mistake-book.json，不上传任何数据"
echo ""
echo "如需卸载：bash $0 --uninstall"