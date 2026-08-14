#!/usr/bin/env bash
# codex-review-loop.sh
#
# 把 codex review 做成"提意见 → 用户处置 → 再 review"循环的辅助脚本。
# 属于 codex-review-loop skill 的手动模式（Mode B）。使用前提：本机已装 codex CLI（`which codex`）。
#
# 用法（从仓库根目录运行）：
#   .codex/skills/codex-review-loop/scripts/codex-review-loop.sh <目标文档路径> [PROMPT 模板路径]
#
# 例：
#   .codex/skills/codex-review-loop/scripts/codex-review-loop.sh \
#     .claude/docs/superpowers/specs/2026-06-18-b-id-h5-bottom-sheet.md \
#     .codex/skills/codex-review-loop/references/prompts/arch-feature.txt
#
# 行为：
#   1. 调 codex review 跑一轮，输出落到 .claude/codex-review-loop-log/<时间戳-文档名>/round-NN.md
#   2. 终端打印 codex 反馈
#   3. 询问用户：[c] 修完文档后回车继续下一轮；[q] 退出
#   4. codex 输出"通过 / Approved / No issues / 没有问题"等明确无意见标志 → 自动退出
#
# 退出条件：
#   - codex 输出末尾匹配 "^通过$" / "^Approved$" / "^No issues found$" 等
#   - 用户主动选 q 退出
#   - 达到最大轮数（默认 8 轮，兜底防死循环）
#
# 设计取舍：
#   - 不自动改文档 —— 让用户/Claude 判断哪些意见成立、哪些反驳
#   - 不自动 git commit —— 让用户控制 commit 节奏
#   - 不并行调多个 codex —— review 上下文是顺序依赖的

set -euo pipefail

# ---------- 参数解析 ----------
SPEC_PATH="${1:-}"
if [[ -z "$SPEC_PATH" ]]; then
  echo "用法：$0 <目标文档路径> [PROMPT 模板路径]" >&2
  exit 1
fi
if [[ ! -f "$SPEC_PATH" ]]; then
  echo "✘ 目标文档不存在：$SPEC_PATH" >&2
  exit 1
fi

PROMPT_TEMPLATE="${2:-}"
DEFAULT_PROMPT_TEMPLATE='审查 SPEC_PATH 中的测试方案文档。请按以下维度找问题：
1) 测试用例预期是否与被测源码真实行为匹配（路径、字段名、分支顺序、错误信息文本）
2) mock 链路设计是否会让用例假阳性通过（mockReset 残留、未声明 spy restore、tunnel mock 拦不到 auto-import 等）
3) 用例数 / task 数 / 全量数全文是否对账
4) 与现有 spec 的范式是否一致
5) 任何技术上的隐患或施工时会卡死的点

如果没有问题，明确回复"通过"。
'

if [[ -n "$PROMPT_TEMPLATE" && -f "$PROMPT_TEMPLATE" ]]; then
  PROMPT_BODY=$(cat "$PROMPT_TEMPLATE")
else
  PROMPT_BODY="$DEFAULT_PROMPT_TEMPLATE"
fi

# ---------- 路径准备 ----------
# 日志落到 gitignore 的 .claude/ 下（不要写进 .codex/skills，那里是版本控制的）
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOG_DIR="$REPO_ROOT/.claude/codex-review-loop-log"
mkdir -p "$LOG_DIR"

SPEC_BASENAME=$(basename "$SPEC_PATH" .md)
SESSION_DIR="$LOG_DIR/$(date +%Y%m%d-%H%M%S)-${SPEC_BASENAME}"
mkdir -p "$SESSION_DIR"
echo "📝 review 日志将落到：$SESSION_DIR"

MAX_ROUNDS=8
TIMEOUT_PER_ROUND_SEC=600

# ---------- 主循环 ----------
ROUND=1

while (( ROUND <= MAX_ROUNDS )); do
  echo
  echo "=========================================="
  echo "🔍 第 $ROUND 轮 codex review"
  echo "=========================================="

  PROMPT_FOR_ROUND="审查 $SPEC_PATH。"
  if (( ROUND > 1 )); then
    PROMPT_FOR_ROUND+="（这是第 $ROUND 轮，前 $((ROUND - 1)) 轮意见已修订）"
  fi
  PROMPT_FOR_ROUND+=$'\n\n'"$PROMPT_BODY"

  ROUND_OUTPUT="$SESSION_DIR/round-$(printf '%02d' "$ROUND").md"

  # codex review 默认非交互；timeout 兜底防卡死
  set +e
  timeout "$TIMEOUT_PER_ROUND_SEC" codex review "$PROMPT_FOR_ROUND" 2>&1 | tee "$ROUND_OUTPUT"
  EXIT_CODE=${PIPESTATUS[0]}
  set -e

  if (( EXIT_CODE == 124 )); then
    echo "⚠️  本轮 codex review 超时（${TIMEOUT_PER_ROUND_SEC}s），退出循环。" >&2
    exit 124
  fi
  if (( EXIT_CODE != 0 )); then
    echo "⚠️  codex review 退出码 $EXIT_CODE，请检查日志：$ROUND_OUTPUT" >&2
    exit "$EXIT_CODE"
  fi

  # ---------- 终止判定 ----------
  # codex 输出末尾若有"通过"或"Approved"独立词，认为无意见
  TAIL_TEXT=$(tail -20 "$ROUND_OUTPUT" | tr -d '[:space:]')
  if echo "$TAIL_TEXT" | grep -qE "(通过|Approved|Noissuesfound|Nofindings|没有问题)$"; then
    echo
    echo "✅ codex 第 $ROUND 轮无新意见，循环结束。"
    echo "   完整日志：$SESSION_DIR"
    exit 0
  fi

  # ---------- 用户处置 ----------
  echo
  echo "------------------------------------------"
  echo "📌 第 $ROUND 轮意见已落到 $ROUND_OUTPUT"
  echo "   现在你可以："
  echo "   [c] 修完文档后回车继续下一轮"
  echo "   [q] 退出循环（剩余意见全部驳回）"
  echo "------------------------------------------"
  read -r -p "选择 [c/q]：" ACTION
  case "$ACTION" in
    q|Q)
      echo "🚪 用户选择退出，剩余意见视为已驳回。"
      echo "   完整日志：$SESSION_DIR"
      exit 0
      ;;
    *)
      echo "▶ 进入下一轮 review..."
      ;;
  esac

  ROUND=$((ROUND + 1))
done

echo "⚠️  已达最大轮数 $MAX_ROUNDS，强制退出。完整日志：$SESSION_DIR" >&2
exit 1
