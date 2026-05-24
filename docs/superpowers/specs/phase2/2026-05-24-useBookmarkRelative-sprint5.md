# 第二期 Sprint 5：composables/useBookmarkRelative 完整覆盖

> 第二期第五个 sprint。覆盖 PLAN §8 P1 第 6 项 useBookmarkRelative composable（157 行）：4 个 type guard + 1 个 enum + showFeedbackView + 2 个 computed-based composable + 3 个 log helper。

**Goal**：`useBookmarkRelative.ts` 全维度覆盖到 80/70/85/80 阈值并启用门槛。

**前置文档**：

- `.claude/test-framework/PLAN.md` §8 P1 第 6 项
- 沉淀范式：sprint 1 + 2 + 3 + 4 累积；本 sprint 复用 sprint 4 的 modal mock 范式（`vi.mock('#layers/core/app/components/Modal')` 拦 showFeedbackModal）

**强制纪律**（继承）：

1. 写 spec 前必须 Read 被测源码 + commons/types/src/interface.ts 看 BookmarkDetail / ShareBookmarkDetail / BookmarkBriefDetail / InlineBookmarkDetail 接口
2. 不用 `as any` / `@ts-ignore` / 过松断言
3. commit message 英文
4. spec 落盘后过 `.claude/test-framework/codex-review-loop.sh` 多轮 codex review

---

## 1. 被测面分析

`apps/slax-reader-dweb/layers/core/app/composables/useBookmarkRelative.ts`（157 行）。

### 1.1 enum + 常量（无需测）

- `BookmarkType { Normal, Share }`：被其它函数消费，间接覆盖
- `BookmarkTabTypes = ['inbox', 'starred', 'topics', 'highlights', 'archive']`：常量数组，**不单独测**（修改即破坏所有消费方，没有"行为"可测）

### 1.2 4 个 type guard（line 27-30）

| 函数                     | 判断条件                                                                     |
| ------------------------ | ---------------------------------------------------------------------------- |
| `isBookmarkDetail`       | `'bookmark_id' in detail && 'starred' in detail && 'archived' in detail`     |
| `isShareBookmarkDetail`  | `'share_info' in detail`                                                     |
| `isBookmarkBrief`        | `'target_url' in detail && 'created_at' in detail && 'updated_at' in detail` |
| `isInlineBookmarkDetail` | `'share_info' in detail && 'user_info' in detail`                            |

**用例**：每个 guard 测 2 个：缺字段 → false / 全字段 → true。**4 × 2 = 8 用例**。

### 1.3 `showFeedbackView`（line 35-58）

- 拼 `href = window.location.origin + window.location.pathname`
- 取 `email = useUserStore().userInfo?.email || ''`
- type=Normal → `showFeedbackModal({ params: { bookmark_id, entry_point: 'bookmark_detail', target_url: href } })`
- type=Share → `showFeedbackModal({ params: { share_code, entry_point: 'share', target_url: href } })`

**用例**：Normal 分支 + Share 分支 + email 缺失 fallback `''`。**3 用例**。

### 1.4 `useBookmarkArticleRelative`（line 60-89）

`allowAction` computed：

- `isBookmarkDetail(detail)` → true
- 否则若 `'share_info' in detail` 且 (`share_info.allow_action` 或 `detail.user_id === userId`) → true
- 否则 false

`bookmarkUserId` computed：

- `isBookmarkDetail(detail)` → `detail.user_id`
- 否则若 `'share_info' in detail` → `detail.user_id`
- 否则 0

**用例**：

- BookmarkDetail（带 bookmark_id）→ allowAction=true, bookmarkUserId=detail.user_id（1 用例）
- ShareBookmarkDetail + share_info.allow_action=true → allowAction=true（1 用例）
- ShareBookmarkDetail + allow_action=false + user_id=userId → allowAction=true（1 用例）
- ShareBookmarkDetail + allow_action=false + user_id≠userId → allowAction=false（1 用例）
- **缺 bookmark_id 的 BookmarkDetail（接口 `bookmark_id?: number` 真可能省略）**+ 没有 share_info → 走 fallback bookmarkUserId=0、allowAction=false（1 用例 —— **审计修订**：codex 第 1 轮指出该 fallback 真可触发，不是"理论不可能"）

**5 用例**。

### 1.5 `useWebBookmarkArticleRelative`（line 91-126）

`allowAction` computed：

- detail=null → false
- `isBookmarkBrief(detail)` → true
- 否则 `isInlineBookmarkDetail(detail)` 且 (`share_info.allow_action` 或 `owner_user_id===userId`) → true
- 否则 false

`bookmarkUserId` computed：

- detail=null → 0
- `isBookmarkBrief(detail)` → `userId || 0`
- `isInlineBookmarkDetail(detail)` → `detail.owner_user_id`
- 否则 0

**用例**：

- detail=null → allowAction=false, bookmarkUserId=0（1 用例）
- BookmarkBrief → allowAction=true, bookmarkUserId=userId（userId 存在）（1 用例）
- BookmarkBrief + userInfo 不存在 → bookmarkUserId=0（1 用例）
- InlineBookmarkDetail + allow_action=true → allowAction=true, bookmarkUserId=owner_user_id（1 用例）
- InlineBookmarkDetail + allow_action=false + owner_user_id===userId → allowAction=true（1 用例）
- InlineBookmarkDetail + allow_action=false + owner_user_id≠userId → allowAction=false（1 用例）

**6 用例**。

### 1.6 `useLogBookmark`（line 131-145）

按 BookmarkType 调 `analyticsLog` auto-import：

- Share 分支：`{ event: 'bookmark_view', id: shareCode, mode: 'snapshot' }`
- Normal 分支：`{ event: 'bookmark_view', id: `${bmId}`, mode: 'snapshot' }`

**用例**：Normal + Share 各 1。**2 用例**。

### 1.7 `logAnalyzed` / `logChat`（line 128-129）

**空实现**（参数前缀下划线，`{}` body）。

**用例**：1 用例统一断言"调用不抛错、无外部副作用"——不对接 mock 也能跑（用 `vi.fn()` spies 监视所有 mock 都没被调）。**实际可省略**——空实现没有可观察行为，写测试无价值。

**决策**：**不为空实现写用例**，用 spec 顶部注释标 "logAnalyzed / logChat 当前为占位空实现，待实现后补"。

合计 sprint 5：8 (type guard) + 3 (showFeedbackView) + 5 (useBookmarkArticleRelative) + 6 (useWebBookmarkArticleRelative) + 2 (useLogBookmark) = **24 用例**。

---

## 2. 测试切分

新建 `apps/slax-reader-dweb/tests/unit/composables/useBookmarkRelative.spec.ts`。

5 个 describe 块（type guard 合并 1 个 + 各函数 1 个）。

---

## 3. mock 链路

### 3.1 nuxt auto-import

```ts
// useUserStore（getter userInfo？.email / userInfo?.userId）—— 来自 #layers/core/app/stores/user
// 注意：useUserStore 在 useBookmarkRelative.ts 是显式 import，不是 auto-import，
// 所以用 vi.mock('#layers/core/app/stores/user', ...) 而不是 mockNuxtImport
const { userStoreMock } = vi.hoisted(() => ({
  userStoreMock: vi.fn(() => ({ userInfo: { userId: 100, email: 'tester@example.com' } as { userId: number; email: string } | null }))
}))
vi.mock('#layers/core/app/stores/user', () => ({
  useUserStore: userStoreMock
}))

// showFeedbackModal —— 显式 import 自 #layers/core/app/components/Modal，同款 vi.mock
const { showFeedbackModalMock } = vi.hoisted(() => ({
  showFeedbackModalMock: vi.fn()
}))
vi.mock('#layers/core/app/components/Modal', () => ({
  showFeedbackModal: showFeedbackModalMock
}))

// analyticsLog —— Nuxt auto-import（useBookmarkRelative.ts:135 直接调用，无 import）
const { analyticsLogMock } = vi.hoisted(() => ({
  analyticsLogMock: vi.fn()
}))
mockNuxtImport('analyticsLog', () => analyticsLogMock)
```

### 3.2 window.location

`showFeedbackView` 用 `window.location.origin + window.location.pathname`。happy-dom 默认有 `http://localhost/`。spec 内每个用例**直接赋值** `window.location.href = 'http://example.test/article/123'` 来锁住 origin/pathname（与 sprint 1 useAuth 同款写法）。

### 3.3 不需要 mock

- `commons/types/src/interface.ts` 的接口（type-only import）
- 4 个 type guard 内部用 `in` 操作符（纯 JS，无副作用）

### 3.4 spec 顶层

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// vi.hoisted + 三个 mock 注册（如 §3.1）

import {
  BookmarkType,
  isBookmarkBrief,
  isBookmarkDetail,
  isInlineBookmarkDetail,
  isShareBookmarkDetail,
  showFeedbackView,
  useBookmarkArticleRelative,
  useLogBookmark,
  useWebBookmarkArticleRelative
} from '~~/layers/core/app/composables/useBookmarkRelative'

beforeEach(() => {
  showFeedbackModalMock.mockReset()
  analyticsLogMock.mockReset()
  userStoreMock.mockReset().mockReturnValue({ userInfo: { userId: 100, email: 'tester@example.com' } })
  window.location.href = 'http://example.test/article/123'
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

---

## 4. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts` 在现有 thresholds 块**追加**：

```ts
'layers/core/app/composables/useBookmarkRelative.ts': {
  lines: 80, branches: 70, functions: 85, statements: 80
}
```

预期实测：lines 100% / functions ≥ 85%（含 logAnalyzed / logChat 空函数 —— **codex review 第 1 轮纠正**：v8 不会把"模块加载时声明但从未调用"的 arrow function 算 covered，本 sprint 不调这两个空函数则 functions 大概率 ≥ 85% 但 < 100%；阈值 85% 已留余量）/ branches 接近 100%（24 用例覆盖每条主要分支）/ statements 100%。

> **不要**为了凑 functions 100% 给 logAnalyzed / logChat 加调用（它们是占位空实现，调它们没有可观察行为，是无效用例）。阈值 85% 为它们留好缓冲。

---

## 5. Sprint 5 任务拆分（2 个 task 串行）

### Task 1：type guard 8 + showFeedbackView 3 + useLogBookmark 2 = 13 用例

新建 spec 文件 + mock 链路骨架。**不**测两个 composable（留 Task 2）。

commit：`test(dweb): cover useBookmarkRelative type guards + showFeedbackView + useLogBookmark (sprint 5.1)`

### Task 2：useBookmarkArticleRelative 5 + useWebBookmarkArticleRelative 6 = 11 用例 + 启用阈值

继续 spec 末尾追加两个 composable 用例（要 ref 包装 detail、computed 触发求值）。

修 vitest.config 启用阈值，跑 coverage 验收。

commit：`test(dweb): cover useBookmarkArticleRelative + useWebBookmarkArticleRelative composables, enable threshold (sprint 5.2)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `useUserStore` 是普通函数还是 Pinia store？sprint 2 测试时已用 Pinia 范式，但本 spec 直接 mock `useUserStore` 返回纯对象，不走 Pinia | 低 | sprint 5 测的是 useBookmarkRelative 自身，不测 user store；vi.mock 替换返回值即可，无需 setActivePinia |
| `showFeedbackView` 的 window.location 在 happy-dom 下能否直接赋值 | 低 | sprint 1 useAuth.spec.ts 已验证可行 |
| computed 在 spec 内的求值时机：`useBookmarkArticleRelative(ref(...))` 后立即读 .value 触发计算 | 低 | Vue computed 是 lazy 的，但 spec 直接 `expect(result.allowAction.value)` 强制求值，不需 nextTick |
| `BookmarkBriefDetail` / `InlineBookmarkDetail` / `BookmarkDetail` / `ShareBookmarkDetail` 接口字段多 + `archived: 'inbox' \| 'archive' \| 'later'` / `starred: 'star' \| 'unstar'` 是字符串字面量类型 —— 用 fixture 还是手写 | 中 | 沿用 sprint 1 思路：本 spec 内构造**字段值与真实接口类型一致**的对象（archived: `'inbox'` 不是 `false`、starred: `'unstar'` 不是 `false`），只省略当前 type guard 用例不涉及的字段。**禁止 `as any`**。如类型 cast 不通过，按 §7 决策仍不写 fixture，改用 `satisfies BookmarkDetail` 保持类型真实 |
| `isInlineBookmarkDetail` 同时检查 `share_info` + `user_info`，与 `isShareBookmarkDetail` 仅检查 `share_info` 重叠 —— 注意构造测试数据时不要让 InlineBookmarkDetail 的对象意外通过 isShareBookmarkDetail 断言 | 中 | type guard 用例用最小字段集，避免冗余字段污染其它 guard |
| Vue ref / computed 在 nuxt-env 下的 import 路径：`import { ref } from 'vue'` 与 sprint 1+2 一致，但 useBookmarkRelative.ts 内部 computed 是 auto-import（无 import 语句） | 低 | spec 自己 `import { ref } from 'vue'`；被测代码内部 computed 走 nuxt auto-import，由 setupNuxt 解析 |

---

## 7. bookmark fixture 决策

PLAN §5.2 第七轮记录把 bookmark.ts fixture 推迟到第二期"补 useBookmark / DwebBookmarkProvider 测试时再写"。本 sprint 测 useBookmarkRelative，需要构造 `BookmarkDetail` / `ShareBookmarkDetail` / `BookmarkBriefDetail` / `InlineBookmarkDetail` 四种形态。

**决策**：本 sprint **不**新建 `tests/fixtures/bookmark.ts`——4 种类型字段差异大，各 type guard 用例用 minimal 字段集就足够（每个用例 5-8 个字段），写 fixture 反而增加维护成本。**等 sprint 6 useBookmark P0 时再写**统一 fixture（届时已有真实后端数据反推）。

---

## 8. 验收清单

- [ ] 24 用例全过（Task 1: 13 + Task 2: 11）
- [ ] useBookmarkRelative.ts 覆盖率 ≥ 80/70/85/80（实测应 lines 100 / branches 接近 100 / **functions ≥ 85（不强求 100，因 logAnalyzed/logChat 空实现未调用）** / statements 100）
- [ ] vitest.config.ts 启用单文件阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 165 → 189 用例通过，0 todo / 0 fail
- [ ] sprint 1-4 共 116 用例无回归
- [ ] commit 全英文 message，分 2 commits
- [ ] spec 文档过 codex-review-loop.sh 多轮全通过 / 全驳回

## 9. Self-Review

1. ✓ 24 用例覆盖 4 type guard + 2 composable 的 allowAction/bookmarkUserId 全分支 + showFeedbackView 两 type 分支 + useLogBookmark 两 type 分支
2. ✓ logAnalyzed / logChat 空实现不写用例（无可观察行为），spec 顶部注释标"待实现后补"
3. ✓ 显式 import 用 vi.mock（useUserStore / showFeedbackModal）；auto-import 用 mockNuxtImport（analyticsLog）
4. ✓ minimal 字段集构造测试数据，不写 fixture（推迟到 sprint 6）
5. ✓ 沿用 sprint 1 useAuth.spec.ts 的 window.location.href 直接赋值范式
6. ✓ spec 顶层 afterEach restoreAllMocks 防 spy 泄漏
