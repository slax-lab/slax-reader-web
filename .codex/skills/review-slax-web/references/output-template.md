# Output Template — review-slax-web

## 文件路径

```
./.claude/deep-review/review-<branch>-<YYYYMMDD-HHMMSS>.md
```

- `<branch>` = `git branch --show-current`（`/` 替换成 `-`）
- 时间戳 = `date +%Y%m%d-%H%M%S`

---

## 报告骨架

````markdown
# PR Review — <branch>

| 字段          | 值                                  |
| ------------- | ----------------------------------- |
| Base          | `<merge-base sha>` (develop)        |
| Head          | `<head sha>`                        |
| Branch        | `<branch>`                          |
| Changed files | N                                   |
| Total diff    | +X / -Y                             |
| Risk level    | Critical / Medium / Low             |
| 生成时间      | YYYY-MM-DD HH:MM:SS                 |
| Reviewer      | Claude Code (review-slax-web skill) |

---

## TL;DR

一两句话总结整个 PR 的核心改动 + review 整体判断。

例：「该 PR 重构了书签列表卡片。组件分层正确，但 BookmarkCell 改到了 fork `app/` 而它其实是继承 upstream 的基线组件（改错层，只半生效）；另有一处 store 解构丢响应性。建议合并前修复 [Critical] 项。」

---

## 上下文摘要（来自阶段 0-1）

### 需求描述（阶段 0.1）

- **来源**：gh pr view / commit messages / branch 名 / `.claude/docs` / 用户对话
- **核心需求**：……
- **验收点**：……（如果有）

### 项目规范（阶段 0.2）

- **找到的规范文件**：`CLAUDE.md` / `AGENTS.md` / `eslint.config.ts` / ……
- **本次 review 引用的具体条款**：「按 CLAUDE.md fork/upstream 规则……」

### 联动范围（阶段 0.3）

- **是否涉及双端/后端/commons 联动**：是 / 否
- **相关项目是否加入工作区**：已加入（列出）/ 未加入（报告标 "未验证联动影响"）
- **触及面**：upstream layer / commons / extension / backend API / i18n / 无

### fork/upstream 归属判定（阶段 1）

- 逐个改动文件标注：fork override / fork-only / upstream layer / commons / extension / configs
- 标出任何"改错层"或"override 漂移"疑点

---

## [Critical] 必须修

### [Critical] <简短标题>

- **位置**: `apps/slax-reader-dweb/app/.../File.vue:LINE`
- **问题**: 详细描述
- **来源**: 肉眼审查 / 调研发现 / sub-agent X / Codex 一致 / Codex 独立发现
- **调研佐证**: [issue#xxxx](https://...) [docs](https://...) （如适用）
- **失效模式**: 一句话描述什么情况下会出事
- **建议**: 具体改法（最好附小段示例代码）

（每个 Critical 项一段。如无，写「无 Critical 项」。）

---

## [Should-Fix] 强烈建议

### [Should-Fix] <标题>

- 同上格式，严重度低一档。

## [Nit] 小问题

### [Nit] <标题>

- 风格、可读性、可选优化。

## [Question] 需要作者再确认

### [Question] <标题>

- 阶段 4 没拿到明确答案的。写清倾向性判断 + 为什么需要确认。

---

## 通过项（已审过、无问题）

简短列出已审过且 OK 的部分，证明覆盖度。例：

- `app/components/BookmarkList/BookmarksTopBar.vue`（fork override）：props/emit/响应式 均 OK
- 归属判定：所有改动文件都在正确的 fork/upstream 层 ✓
- i18n：zh/en 同步 ✓

---

## 调研记录（透明度）

| #   | 研究点                    | 查询词                                      | 命中链接    | 结论                       |
| --- | ------------------------- | ------------------------------------------- | ----------- | -------------------------- |
| 1   | Vue3.5 props 解构响应性   | `Vue 3.5 props destructure reactivity 2026` | [docs](url) | 命中：编译期保留，用法 OK  |
| 2   | VueUse useIntervalFn 清理 | `useIntervalFn cleanup onUnmounted`         | [docs](url) | 自动清理，与本 PR 用法匹配 |
| ... |                           |                                             |             |                            |

没命中有效信息的也要列（写「无相关问题」），不要省略。

---

## Sub-Agent 报告摘要

按阶段 5(A) 实际启动的 sub-agent 各写一节；没启动的省略。

### 最小化扫描 / 复用扫描 / 响应式&边界扫描 / fork 归属扫描 / 调用方扫描 / 本地优先扫描 / 测试扫描 / 联动影响

- 每节：结论摘要 + 代表条目（带 `file:line`）+ 末尾标注升级为哪些 [Critical]/[Should-Fix]/[Nit]（写编号）

---

## Codex /review 意见

来源：`/tmp/review-slax-web-codex.txt`

### Codex 的关键发现

1. …
2. …

### 与 Codex 的对照

| Codex 发现 | 我的判断 | 是否纳入报告 |
| ---------- | -------- | ------------ |
| …          | …        | …            |

### 与 Codex 的分歧

- 我认为 X，Codex 认为 Y —— 倾向 X，因为 …
- 如果无分歧，写「与 Codex 判断完全一致」

---

## 用户对话记录

### Round 1

- **Q**: …（含 options）
- **A**: …
- **影响**: 纳入 [Should-Fix]-2 …

（一轮都没问 → 写「本次 PR 无需澄清，未发起对话」并解释为什么。）

---

## Coverage notes

- 复用机会: <复用扫描输出>
- 最小化机会: <最小化扫描输出 / "未开启">
- fork/upstream 归属: <归属扫描输出>
- 响应式/边界: <响应式&边界扫描输出>
- 本地优先: <本地优先扫描输出 / "本次不涉及">
- 调用方影响: <调用方扫描输出>
- 测试覆盖: <测试扫描输出的 missing tests>
- 联动影响: <联动扫描输出 / "未验证" / "本次不涉及">
- 样式/i18n: <硬编码颜色 / token 漂移 / i18n 对齐情况>

---

## 未来改进（出本 PR 范围）

不影响本 PR merge 但值得后续做的。

---

## Review 元数据

| 指标                        | 实际值                |
| --------------------------- | --------------------- |
| 阶段 3 搜索次数             | N                     |
| 阶段 4 对话轮数             | N                     |
| 阶段 5(A) 启动 sub-agent 数 | N                     |
| 阶段 5(B) Codex 是否执行    | 是 / 否（如否，原因） |

---

## 怎么把这份 review 同步到 PR

装了 `gh`：

```bash
gh pr review <PR号> --body-file <本文件> -c
```
````

否则复制「TL;DR + Critical + Should-Fix + Nit」到 GitHub PR。

---

## 写作要点

- 位置精确到 `file:line`
- 建议给具体改法，不写「应该改进」
- 来源标清（肉眼/搜索/agent/Codex）
- 没发现就明说（"无 Critical 项"），不省略章节
- 调研记录要全
- 不用 emoji，用文本 marker（[Critical] / [Should-Fix] / [Nit] / [Question]）
