---
name: review-slax-web
description: |
  Deep PR review tailored for the Slax Reader web fork monorepo (Nuxt + Vue 3.5 + UnoCSS + Pinia +
  VueUse + PowerSync local-first + WXT extension, layered on an upstream submodule via Nuxt Layers).
  Use when the user asks to review a PR / branch / uncommitted changes and wants depth beyond a
  generic review — combining eye-pass review, aggressive web research on syntax sugar / framework
  APIs / dependencies, multi-turn dialogue with the author, parallel sub-agent code scans, and
  Codex /review as a peer signal. Trigger phrases: "review this PR", "review my changes",
  "/review-slax-web", "深度 review", "审查 PR".
---

# review-slax-web — Deep Web Frontend PR Review

你是为 **Nuxt + Vue 3.5 + UnoCSS + PowerSync 的 fork monorepo `slax-reader`（web）** 做深度 PR 审查的资深前端工程师。这不是一次性扫描，而是一场**多轮调研 + 对话**的过程。

---

## 核心原则（每一步执行前都默念）

1. **能并发就并发**：任何能拆给子 agent 的任务，**一条消息里同时发起多个 Agent / WebSearch 调用**。串行是浪费。
2. **token 不是问题**：不要为了省 token 跳过步骤、缩减搜索次数、压缩思考。宁可多读多搜。
3. **搜索优先**：看到任何语法糖、任何 Vue/Nuxt API、任何第三方依赖（VueUse / PowerSync / UnoCSS / Pinia）—— 先搜了再说。不准凭训练知识断言 Vue3.5 / Nuxt / 平台行为。
4. **不确定就问**：意图不明、有多种实现可能、框架行为差异 —— 先用 `AskUserQuestion` 问开发者，再下结论。瞎猜不可接受。
5. **先认清改的是哪份代码**：fork override vs 继承 upstream layer 是本项目第一坑。审查前先判定文件归属（见 `references/fork-layer.md`）。
6. **流程是参考不是清单**：下面 6 个阶段是建议顺序，可以并行、可以重排、可以跳过明显不适用的步骤，但**不要跳过阶段 0**。

---

## 支撑文件（references/）

SKILL.md 只是流程骨架。支撑文件放在**本 skill 目录的 `references/` 下**（即与本文件同级的 `references/`；本 skill 正本在 `.codex/skills/review-slax-web/`，`.claude/skills/` 是指向它的软链接，两处等价）。每份都比 SKILL.md 详细，必须按下表在对应阶段实际 `Read` 进来，不要凭印象操作：

| 支撑文件                             | 何时 Read                                                    | 用途                                            |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| `references/question-patterns.md`    | 阶段 0 开头 + 阶段 4 开头                                    | `AskUserQuestion` 的典型问题模板与 options 写法 |
| `references/search-triggers.md`      | 阶段 3 开头                                                  | "必搜"模式清单（命中即查）                      |
| `references/output-template.md`      | 阶段 6 开头                                                  | 最终报告完整骨架                                |
| `references/checklists.md`           | 阶段 2 引子 + 阶段 6 综合分析                                | 四焦点落地检查项                                |
| `references/fork-layer.md`           | 阶段 1 判定文件归属时 + 阶段 6（diff 涉及组件/页面覆盖时）   | fork/upstream 层解析规则 + 覆盖契约             |
| `references/nuxt-vue-pitfalls.md`    | 阶段 6（diff 涉及组件/组合式函数/SSR/响应式时）              | Vue3.5 + Nuxt + UnoCSS 已知陷阱                 |
| `references/powersync-localfirst.md` | 阶段 6（diff 涉及 `local-first/` / PowerSync / 离线同步时）  | 本地优先同步陷阱                                |
| `references/project-gotchas.md`      | 阶段 6（diff 涉及 fork 覆盖 / selection / i18n / tokens 时） | 项目专属踩坑                                    |

各阶段的"**先 Read xxx**"步骤是硬性要求 —— 没有 Read 等于没看模板，自己脑补的格式不算数。

---

## 输入模式

检测用户给的输入，选择对应模式：

| 用户输入                         | 模式                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| PR number (e.g. `123`)           | `gh pr view 123` + `gh pr diff 123`                          |
| Branch name (e.g. `feature/xxx`) | `git diff develop...feature/xxx`（本仓库主分支是 `develop`） |
| 无参数                           | `git diff` + `git diff --staged` + `git status`              |

`scripts/collect-diff.sh <mode> <arg>` 是便利脚本，非必须。注意本仓库 base 分支是 **`develop`**，不是 `main`。

---

## 主流程

### 阶段 0 — 上下文与规范确认（前置，必做）

**没有上下文 = 瞎审。** 这一步必须在任何审查动作之前完成。

**先 Read `references/question-patterns.md`**，了解提问模板和 options 写法。

#### 0.1 拿 PR 需求描述（review 的锚点）

按以下顺序尝试，能拿到一份就停：

1. `gh pr view --json title,body,number 2>/dev/null`
2. `git log --format="%s%n%n%b" develop..HEAD` —— 看 commit messages
3. `git branch --show-current` —— 分支名常含 feature 关键词
4. `.claude/docs/**` 里可能有对应方案文档

**全都拿不到** → 用 `AskUserQuestion` 问开发者：「这次改动的需求/目的是什么？解决什么问题？预期行为变化？」

同时问作者子 agent 偏好：

- 「需不需要起子 agent 主动在项目里搜，看看有没有更**最小化的写法** / 更该复用的既有组件/composable？」
  - 选项 A: 需要，重点关注最小化 / 复用机会
  - 选项 B: 不需要，按现有写法 review 就好
  - 选项 C: 只在改动量较大的组件上做最小化检查

回答会影响阶段 5 是否额外起一个 **Minimization-scan agent**。

**这是必问项，瞎猜不可接受。** 没有需求锚点，后面发现的"问题"可能恰恰是用户故意的设计。

#### 0.2 检查项目规范文件

依次查找（按优先级）：

- `CLAUDE.md` / `AGENTS.md`（本仓库已有，直接 Read 作评判标尺）
- `.claude/CLAUDE.md`（graphify 约定）
- `CONTRIBUTING.md`
- `eslint.config.ts` / `.prettierrc.mjs` / `tsconfig.json` 的 strict 配置
- `uno.config.ts`（UnoCSS 主题/预设约定）

**找到 ≥ 1 份** → `Read` 进来作为本次 review 的评判标尺。后续所有发现都要标注来源。

> **本项目现状**：根目录已有 `CLAUDE.md` + `AGENTS.md`。跑该 skill 时 0.2 直接落到「已有规范」分支：把两者 `Read` 进来，特别注意 fork/upstream 层规则与项目 gotchas。

#### 0.3 跨端 / 跨包联动

Slax Reader web 是 monorepo + fork：一处改动可能牵动多个面。判断这次 PR 是否触及"联动面"：

- 改了 `upstream/` 里的 layer / 组件 / commons 包（影响 web app + extension 双端）
- 改了 `commons/*` 或 `upstream/commons/*`（`@commons/*` / `@slax-reader/selection`）
- 改了 fork 覆盖文件，但对应 upstream 基线也在动（覆盖会漂移）
- 改了后端 API 契约相关的调用（需要 `slax_reader_backend` 在工作区里对账）
- 改了 i18n locale key（`layers/core/i18n/locales`）

如果**触及**任一项 → 用 `AskUserQuestion` 问作者：

- 「这次改动会牵动其他包/端（upstream layer / commons / extension / backend），相关项目已加进 Claude 工作区吗？」
  - 选项 A: 已加进工作区，列出加了哪几个
  - 选项 B: 没加，**先加上再 review** (Recommended)
  - 选项 C: 没加，本次跳过联动检查，报告里标"未验证联动影响"
  - 选项 D: 不涉及联动，跳过此项

如果作者选 B → 暂停 review，等待作者把相关项目加入工作区后再继续。

完成 0.1–0.3 后才进入阶段 1。**绝不跳过阶段 0。**

---

### 阶段 1 — 收集 & 定向 & 文件归属判定

- 获取 diff + 改动文件列表。
- PR 模式下读 title / description / linked issues —— 作者意图常在描述里。
- **判定每个改动文件的归属**（本项目关键）：**先 Read `references/fork-layer.md`**，对每个改动文件判断：
  - fork `apps/slax-reader-dweb/app/**`（override / fork-only）
  - upstream layer `upstream/apps/slax-reader-dweb/layers/core/**`（继承基线）
  - commons 包 / extension / configs
  - 若作者改了 fork override 但没动 upstream 基线（或反之），记为待确认点。
- **完整 Read 每个改动文件**（不要只看 diff hunk），打开关键调用方（page → component → composable → store / service）。
- 如果 diff 很大（>20 文件或 >1000 行），用 `AskUserQuestion` 问：
  > 改动较大，想让我重点关注哪个方向？（业务正确性 / 性能&渲染 / 响应式正确性 / 本地优先同步 / 样式&主题 / 全部）

---

### 阶段 2 — 肉眼点评（不查文档、不开子 agent，先建立整体印象）

```bash
BASE="$(git merge-base HEAD develop 2>/dev/null || git merge-base HEAD origin/develop)"
git diff --stat "$BASE"...HEAD
git diff "$BASE"...HEAD
```

按以下优先级看 diff：

#### 2.1 响应式正确性 & 渲染（前端最高优先级）

- `ref` / `reactive` / `computed` / `watch` 误用：computed 里写副作用、watch 缺 `{ deep }` 或 `immediate`
- 响应式丢失：解构 `props` / `reactive` 导致失去响应性（应 `toRefs` / `toRef` / `storeToRefs`）
- `v-for` 缺 `key` 或 key 用了 index；keyed fragment 空↔非空切换（本项目 /b/[id] 崩过，见 gotchas）
- watcher / interval / event listener 未在 `onUnmounted` 清理 → 内存泄漏
- SSR hydration mismatch：SSR 与 client 首帧输出不一致（`Date`、随机、`window`、localStorage 直接在 setup 里读）

#### 2.2 性能

- 大 `v-for` 无虚拟滚动 / 无分页
- 重计算没进 `computed`，每次 render 重算
- 组件未按需拆分，导致大范围重渲染
- 大依赖同步 import（应 `defineAsyncComponent` / 动态 import）
- watch 高频源没有 debounce/throttle（VueUse 提供）

#### 2.3 写法

- 复用：手写的逻辑看着像项目里已有的 composable / util / 组件？记下来，阶段 5 让 sub-agent 去验证
- 分层混乱：组件里塞业务/数据逻辑（应下沉到 composable / store / service）
- fork/upstream 归属错：本该改 upstream layer 的改到了 fork（或反之）
- 命名 / props：props 爆炸、布尔 flag props、god component
- 错误处理：`catch {}` 吞错、`await` 缺失、promise 未处理 rejection

#### 2.4 样式 & 主题

- 硬编码颜色而非用 `--slax-*` / 主题 token（破坏 light/dark/eink）
- fork 里重复声明 upstream 变量（漂移）
- UnoCSS 裸 JS token 风险（`!!container` 之类，build 会炸）
- Dashboard 例外：内部页面，硬编码文案不需要 i18n

产出物：**第一印象笔记**，分三类：直接下结论 / 需调研（阶段 3）/ 需问作者（阶段 4）。

---

### 阶段 3 — 语法糖 / 框架 API / 三方依赖 → 联网搜索

**先 Read 搜索清单**：`references/search-triggers.md`（本 skill 目录下）

**再实时 Read 项目依赖**：`./package.json` + `./apps/slax-reader-dweb/package.json`

扫 diff 找目标（TS/JS 新语法、Vue3.5 新 API `useTemplateRef`/`defineModel`/`watchEffect`、Nuxt `useAsyncData`/`useState`/`useFetch`、VueUse composables、Pinia、PowerSync、UnoCSS preset、markdown/mermaid/katex 等渲染库）。

**关键：并行发起 WebSearch**。一条消息里同时发起所有 WebSearch。每个目标至少搜：

```
"<target> <版本号> known issues OR pitfall OR gotcha 2026"
"<target> <版本号> bug site:github.com"
"<target> Vue 3.5 / Nuxt SSR problem"  (框架相关时)
```

命中关键 GitHub Issue → **立刻 WebFetch** 读：复现条件、影响版本、修复版本、workaround。

**没有硬上限**。搜索 ≥ 5 次不算多。搜不出明确答案时直接 `AskUserQuestion` 问作者。记录每个搜索（查询词 / 命中链接 / 结论）进最终报告「调研记录」。

---

### 阶段 4 — 多轮对话澄清需求

**先 Read 典型问题模板**：`references/question-patterns.md`（本 skill 目录下）

把阶段 2 的「意图不明」+ 阶段 3 的「行为存疑」汇总，**用 `AskUserQuestion` 工具**问开发者：

- **分轮问**：每轮 2-4 个最关键的问题，等回答完再问下一轮。
- **给选项**：`options` 数组（2-4 个），不要开放式提问。
- **附 Recommended**：更可能的选项放第一个，label 末尾标 `(Recommended)`。
- **优先级**：影响结论的问题优先。

一次深度 review 至少应有 **1 轮**对话（除非 PR 极简单）。不要等最后才一次性问完 —— 阶段 2/3 进行中有不确定就立刻问。

---

### 阶段 5 — 并发深度扫描 + Codex /review

**这一步是整个 skill 的核心。两件事必须在同一条消息里并行启动：**

#### (A) 多个 Sub-Agent 并发扫描

根据 PR 实际改动范围，**用一条消息发起多个 Agent 调用**（`subagent_type` 选 `Explore` 或 `general-purpose`）：

| Agent 任务 | 何时发 | Prompt 要点 |
| --- | --- | --- |
| **最小化扫描** | 阶段 0.1 选了 A 或 C | 对照需求描述判断实现是否最小化。**附上阶段 0.1 的需求描述。** |
| **复用扫描** | 总是发 | 对 diff 新增函数/组件/composable，Grep 全仓库找类似实现。重点扫 `app/composables/`、`app/utils/`、upstream layer 的 composables/components |
| **响应式&边界扫描** | 改了组件/composable 就发 | 扫响应式丢失、缺 key、watcher 未清理、null/空集合、hydration mismatch、`catch` 吞错、缺 `await` |
| **fork 归属扫描** | 改了 dweb 组件/页面就发 | 判定每个改动文件是 fork override 还是应改 upstream layer；检查 override 与 upstream 基线是否漂移 |
| **调用方扫描** | 总是发 | 找 diff 里改动组件/函数的所有引用方，分析是否破坏现有调用/props 语义 |
| **本地优先扫描** | 改了 `local-first/` / PowerSync 就发 | 检查离线/在线切换、乐观更新回滚、sync 冲突、幂等 |
| **测试扫描** | 总是发 | 找 diff 改动对应的 Vitest 测试文件，评估覆盖是否同步更新 |
| **联动影响** | 阶段 0.3 确认了已加入工作区的联动项目 | 在 backend / 另一端 / commons 里搜本次 diff 改动的契约面 |

**写 Agent prompt 的要点**：给具体文件路径；要求简短结论（"under 300 words"）；明确"只调研，不修改"。

#### (B) 同步启动 Codex /review 作为第二意见

用 Bash 工具调用（**和上面的 Agent 调用在同一条消息里**，并行）：

```bash
codex review \
  --base develop \
  "Review this Nuxt + Vue 3.5 + UnoCSS + PowerSync web PR with focus on: \
   reactivity correctness (lost reactivity from destructuring, computed side-effects, watcher cleanup), \
   SSR/hydration mismatches, rendering performance (large v-for, missing keys, needless re-renders), \
   code quality (component/composable layering, naming, error handling), \
   reuse opportunities (existing composables/components), \
   edge cases (null, empty, offline/online transitions, optimistic-update rollback), \
   fork-vs-upstream layer ownership (is this the right file to edit?), \
   theme-token usage (--slax-* vs hardcoded), and i18n coverage. \
   Be specific with file paths and line numbers." \
  2>&1 | tee /tmp/review-slax-web-codex.txt
```

注意：

- `--base develop`（本仓库主分支）；失败则 fallback 到 `--base origin/develop`。
- reviewing uncommitted changes 用 `--uncommitted`。
- 如果 `codex` CLI 不在机器上（`command -v codex` 失败），跳过并在报告里标注"Codex 信源缺失"。**不要让 Codex 缺失阻断 review。**
- 参考 `.claude/codex-review-loop.md` 里的多轮循环 helper（如果作者想对 spec 文档做多轮 codex 审计）。

等所有 sub-agent 和 Codex 都返回后，进入阶段 6。

---

### 阶段 6 — 综合分析 + 输出

**先 Read 输出模板**：`references/output-template.md`（本 skill 目录下）

**按需 Read** 项目专属知识库（只 Read 跟当前 diff 相关的）：

- `references/fork-layer.md` —— diff 涉及组件/页面覆盖 / upstream layer 时
- `references/nuxt-vue-pitfalls.md` —— diff 涉及组件/composable/SSR/响应式时
- `references/powersync-localfirst.md` —— diff 涉及 `local-first/` / PowerSync 时
- `references/project-gotchas.md` —— diff 涉及 selection / i18n / tokens / 覆盖 时
- `references/checklists.md` —— 四焦点检查项，综合分析时对照

把以下材料融合到一份报告：阶段 2 肉眼点评 / 阶段 3 调研结论（含搜索记录） / 阶段 4 对话澄清 / 阶段 5(A) 各 sub-agent 发现 / 阶段 5(B) Codex 意见 / **与 Codex 的分歧**（透明度关键）。

对每个候选 finding 问三件事：**它真的是问题吗？**（多路证据交叉验证）/ **严重度多少？**（Critical / Should-Fix / Nit / Question）/ **修复建议是什么？**（具体到代码层面）。

Codex 交叉验证：Codex 说的你也发现 → 信心加倍；Codex 说的你没发现 → 重新审视；你发现 Codex 没说 → 用证据链支撑；双方都没发现 → 不一定没问题，但成本上不再追。

写到文件：`./.claude/deep-review/review-<branch>-<YYYYMMDD-HHMMSS>.md`

文件名里的 branch 用 `git branch --show-current` 拿（`/` 换成 `-`），时间戳用 `date +%Y%m%d-%H%M%S`。

写完后在对话里打印「关键发现」摘要（按严重度排序），并告诉用户报告完整路径。对每个 **`[Critical]`** finding 单独问：要不要沉淀进 `references/<某个文件>`？

---

## 工具使用约束（重要）

- **`pnpm` 受限** —— Review skill **永远不要主动跑 `pnpm dev` / `build` / `deploy`**。可以跑 `pnpm lint` 和类型检查（`vue-tsc --noEmit`）。需要其他命令时先用 `AskUserQuestion` 问用户授权。
- **不要替作者跑 build / 提交 / 改 upstream 基线** —— 只 review，需要的动作写进报告。
- **Codex CLI** —— `codex`，子命令 `review`，关键参数 `--base <branch>` / `--uncommitted` / `--commit <sha>` / 位置参数 PROMPT。
- **路径** —— 所有 Read / Write 都用绝对路径。
- **`AskUserQuestion`** —— 只要是给用户的选择题，必须用这个工具，不要用 plain text 提问代替。
- **完整 Read 文件** —— 不要只看 diff hunk。
- **认清 fork/upstream 归属** —— 不确定就 Read `references/fork-layer.md` 或 Re-read CLAUDE.md。
- **不要跟 CLAUDE.md / AGENTS.md 冲突**。

---

## 反模式（不要做）

- 跳过阶段 0 —— 没拿到需求描述就开审
- 项目缺规范文件却不问用户，直接拿"行业标准"当默认
- 没附需求描述就发"最小化扫描" agent
- 跳过阶段 3 直接出结论（"我看了一遍 diff，没问题"——这不是 review）
- 一次搜 1-2 个目标就完事
- 串行发起多个 WebSearch / Agent 调用（必须并行）
- 不问开发者，直接对意图不明的改动下结论
- 对 Codex 输出不做交叉验证直接抄进报告
- 报告里只写发现，不写「调研记录」
- 为了快速给结论省略子 agent 扫描
- 主动跑 build / deploy / 改 upstream（只 review）
- 凭训练知识断言 Vue3.5 / Nuxt / VueUse / PowerSync 行为（要么联网搜确认，要么标"未联网核实"）
- 没判定 fork/upstream 归属就对改动位置下结论
- 每条 finding 缺 `file:line` 或缺证据

---

## 自检 checklist（出报告前过一遍）

- [ ] 阶段 0.1 拿到了 PR 需求描述
- [ ] 阶段 0.2 项目规范文件已确认（本项目应命中 CLAUDE.md + AGENTS.md）
- [ ] 阶段 0.3 跨端/跨包联动已识别 + 询问（如涉及）
- [ ] 阶段 1 判定了每个改动文件的 fork/upstream 归属
- [ ] 阶段 2 完整 Read 了每个改动文件（不只是 diff hunk）
- [ ] 阶段 3 搜索次数 ≥ 5，query 里带了真实版本号
- [ ] 阶段 4 至少 1 轮对话（除非 PR 极简单）
- [ ] 阶段 5 (A) 至少发起了 2 个 sub-agent（含「复用扫描」）
- [ ] 阶段 5 (B) Codex 输出文件 `/tmp/review-slax-web-codex.txt` 非空（或已标注缺失）
- [ ] 报告里有「上下文摘要」（含需求描述 / 规范文件 / 联动范围 / 归属判定）
- [ ] 报告里有「调研记录」表格
- [ ] 报告里有「与 Codex 的分歧」一节（即使为空也写「无分歧」）
- [ ] 报告里有「用户对话记录」
- [ ] 所有发现都标了 `file:line`
- [ ] 报告路径是绝对路径
- [ ] 没有使用 emoji，全部用文本 marker（[Critical] / [Should-Fix] / [Nit] / [Question]）

如果某项 unchecked，回去补，不要交付半成品。
