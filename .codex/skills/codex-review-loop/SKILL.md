---
name: codex-review-loop
description: |
  Multi-round codex review loop for a DOCUMENT (spec / plan / design / architecture / test-plan) —
  NOT a code diff. Runs `codex review` against the doc, surfaces findings, you triage (accept →
  edit the doc / rebut → record why), then re-runs, repeating until codex replies "通过"/Approved or
  you stop. Catches "missing branches / miscounted cases / broken mock chain / doesn't match source"
  before a plan reaches implementation. Use after writing or substantially revising a spec/plan doc,
  or when a design doc feels risky. Trigger phrases: "/codex-review-loop", "codex 多轮审", "spec
  review loop", "跑一轮 codex 审这个方案", "帮我用 codex 循环审这份文档".
---

# codex-review-loop — 文档多轮 codex 审计循环

把 `codex review` 做成「提意见 → 处置 → 再审」的多轮循环，让**方案/spec/设计文档**在交付施工前把问题挖干净。审的是**文档**（不是代码 diff——那用 `review-slax-web`）。

---

## 何时使用

- 新 sprint 子方案 / plan / spec 落盘之后（典型在 `.claude/docs/superpowers/specs|plans/**`）
- 顶层设计文档、架构方案、迁移方案大改后
- 任何怀疑会「漏分支 / 用例数对不上 / mock 链路有 bug / 与源码不符 / 施工时才炸」的文档

## 前提

- 本机已装 codex CLI（先 `command -v codex`；没有则告知用户无法运行，不要硬跑）
- 目标文档已写完一版并保存到磁盘（codex 读的是磁盘上的文件）

---

## 两种模式

### Mode A — Claude 驱动（在本 skill 内运行时的默认）

脚本 `scripts/codex-review-loop.sh` 靠交互式 `read` 在每轮之间等人处置——**Claude 通过 Bash 跑它无法应答那个交互**。所以 Claude 驱动时**不要跑那个脚本的循环**，而是自己一轮一轮编排：

1. **选 prompt 维度**：先 Read `references/prompt-guide.md`，按文档类型选一份 `references/prompts/*.txt`（测试 spec 用 `test-spec.txt`，功能/架构用 `arch-feature.txt`，UI 方案参照 `ui-frontend-example.txt` 改写，其它自写）。
2. **跑一轮**（非交互，`codex review` 天然非交互）：

   ```bash
   mkdir -p .claude/codex-review-loop-log
   LOG=".claude/codex-review-loop-log/$(date +%Y%m%d-%H%M%S)-<doc-basename>"
   mkdir -p "$LOG"
   timeout 600 codex review "审查 <doc-path>。

   <把选定 prompt 模板的正文粘进来>" 2>&1 | tee "$LOG/round-01.md"
   ```

   - `--base` 不用；这里是让 codex 读某个文档并按 prompt 找问题（位置参数即 prompt）。
   - 每轮输出 tee 到 `$LOG/round-NN.md`，便于回溯。

3. **完整读本轮 findings**，逐条 triage（见下方「处置协议」）。
4. **成立的意见 → 直接编辑目标文档修正**；**不成立的 → 记下反驳理由**（不改文档）。
5. **再跑下一轮**，prompt 里加一句「这是第 N 轮，前 N-1 轮意见已修订」，让 codex 基于修订后的文档重审。
6. **终止**：codex 本轮明确回「通过 / Approved / No issues / 没有问题」，或达到上限（默认 8 轮），或用户喊停。
7. **收尾**：把「共几轮、每轮几条、成立/反驳、最终是否通过」汇总给用户；不要自动 commit。

> 每轮之间要不要继续 / 是否接受某条有争议的意见——**拿不准就用 `AskUserQuestion` 问用户**，别替他默认接受 codex 的判断。

### Mode B — 用户在自己终端手动跑

脚本适合用户自己在终端里跑（交互 `read` 能正常应答）。告诉用户：

```bash
# 默认（测试 spec 维度）
.codex/skills/codex-review-loop/scripts/codex-review-loop.sh <目标文档路径>

# 指定 prompt 模板
.codex/skills/codex-review-loop/scripts/codex-review-loop.sh \
  <目标文档路径> \
  .codex/skills/codex-review-loop/references/prompts/arch-feature.txt
```

每轮结束脚本会问 `[c] 修完继续 / [q] 退出`；codex 回「通过」则自动结束。日志落到 `.claude/codex-review-loop-log/<时间戳-文档名>/round-NN.md`。

---

## 处置协议（每条 finding）

对 codex 每一条意见问三件事：

1. **成立吗？** — 回到目标文档 + 真实源码核对。codex 会臆造行号/字段，**不要无脑接受**；用证据判定。
2. **成立 → 怎么改？** — 直接编辑目标文档，让下一轮 codex 看到修订后的版本。
3. **不成立 → 为什么？** — 记一句反驳理由（放进给用户的汇总；文档不动）。

不确定的、或改动会牵扯设计取舍的 → `AskUserQuestion` 问用户，别自作主张。

---

## 设计取舍（沿用脚本约定）

- **不自动改文档背后的意图**：由人/Claude 判断意见成立或反驳，避免 codex 误判被无脑吸收。
- **不自动 git commit**：让用户控制 commit 节奏。
- **不并行调多个 codex**：review 上下文顺序依赖（第 N 轮看的是第 N-1 轮修订后的产物）。
- **退出码**（Mode B）：`0` 正常（通过 / 用户 q），`124` 超时，其它为 codex 异常码。

## 实战参考

一次 environment.ts 测试 spec 用本循环跑了 4 轮：轮 1 抓 4 条（用例预期与源码不符 / 计数对不上 / stub 路径错 / spy restore 缺失）、轮 2 抓 1 条（漏改的旧计数）、轮 3 抓 2 条（v8 覆盖率算法限制 / 回归数漂移）、轮 4 通过。7 条全部成立、0 反驳——说明维度写得越具体，codex 越能挖出真问题。

---

## 反模式

- Claude 直接跑 `scripts/*.sh` 的循环（交互 `read` 应答不了，会卡住）——Claude 用 Mode A 自己编排
- prompt 维度写得太泛（"看看有没有问题"）——codex 会敷衍；照 `prompt-guide.md` 写可核对的维度
- 无脑接受 codex 每条意见 / 无脑改文档——必须逐条用源码核对
- 把日志写进 `.codex/skills/...`（那是版本控制目录）——日志一律落 `.claude/codex-review-loop-log/`
- codex 没装就硬跑 / 让 codex 缺失阻断——先 `command -v codex`，缺失就如实告知
- 自动 git commit 修订后的文档——交给用户
