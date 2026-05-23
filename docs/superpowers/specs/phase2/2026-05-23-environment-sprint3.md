# 第二期 Sprint 3：utils/environment.ts + DwebEnvironmentAdapter 完整覆盖

> 第二期第三个 sprint。覆盖两个轻量纯逻辑模块：`utils/environment.ts`（58 行 3 个函数：getAcceptLanguage / getPreferredLanguage / isSlaxReaderApp，13 用例）+ `components/Article/Selection/adapters/DwebEnvironmentAdapter.ts`（27 行 class，3 个方法：getWindow / getDocument / getSelection，6 用例）。合计 19 用例。

**Goal**：两个文件全维度覆盖到 80/70/85/80 阈值并启用单文件门槛。

**前置文档**：

- `.claude/test-framework/PLAN.md` §8 P1 第 1+5 项
- 复用范式：sprint 1（vi.hoisted + mockNuxtImport + isClient/isServer 翻转 via vi.doMock）+ sprint 2（vi.spyOn 替代 mock）

**强制纪律**（继承 sprint 1+2）：

1. 写 spec 前必须 Read 被测源码
2. 不用 `as any` / `@ts-ignore` / 过松断言
3. commit message 英文

---

## 1. 被测面分析

### 1.1 `utils/environment.ts`（58 行）

| 函数 | 行号 | 行为 |
| --- | --- | --- |
| `getAcceptLanguage` | 7-19 | isClient=false → 返回 `''`；navigator.languages 非空 → 用 `,` 拼接；否则 fallback `navigator.language \|\| ''` |
| `getPreferredLanguage` | 24-46 | 入参 acceptLanguage 为空时 → 调 getAcceptLanguage；返回值仍为空 → `'en'`；否则按 `,` split + `;` 截断 + 小写化 + 找首个 `zh` 前缀 → `'zh'`，否则 `'en'` |
| `isSlaxReaderApp` | 51-57 | isClient=false → false；否则 `navigator.userAgent.includes('SlaxReader')` |

### 1.2 `DwebEnvironmentAdapter`（27 行）

| 方法           | 行号  | 行为                                                     |
| -------------- | ----- | -------------------------------------------------------- |
| constructor    | 11-13 | 可选传入 iframe                                          |
| `getWindow`    | 15-17 | iframe 存在 → `iframe.contentWindow!`；否则 `window`     |
| `getDocument`  | 19-21 | iframe 存在 → `iframe.contentDocument!`；否则 `document` |
| `getSelection` | 23-26 | 调 `getWindow().getSelection()` 返回 Selection \| null   |

---

## 2. 测试切分

新建两个 spec 文件（**两个被测在不同目录，不合并到一个 spec**）：

- `apps/slax-reader-dweb/tests/unit/utils/environment.spec.ts`
- `apps/slax-reader-dweb/tests/unit/components/Article/Selection/adapters/DwebEnvironmentAdapter.spec.ts`

第二个路径深，但镜像源码路径是测试目录约定。

### 2.1 environment.spec.ts（**13 用例**）

```
describe('客户端环境', () => {
  describe('getAcceptLanguage', () => {
    it('navigator.languages 非空 → 用 "," 拼接')
    it('navigator.languages 为空但 navigator.language 有值 → 返回 navigator.language')
    it('navigator.languages 为空且 navigator.language 为空 → 返回 ""')
  })

  describe('getPreferredLanguage', () => {
    it('显式传入 "zh-CN,en" → "zh"')
    it('显式传入 "en-US,fr" → "en"')
    it('显式传入空字符串且 navigator 也无语言 → fallback "en"')
    it('显式传入空字符串但 navigator 有 zh-CN → "zh"（间接调 getAcceptLanguage）')
    it('含 q 权重 "en;q=0.9,zh;q=0.8" → 截断 ";" 后遍历找首个 zh 前缀，返回 "zh"（源码不按 q 权重排序）')
    it('混合大小写 "ZH-CN,EN" → 小写比对仍返回 "zh"')
  })

  describe('isSlaxReaderApp', () => {
    it('navigator.userAgent 含 "SlaxReader" → true')
    it('navigator.userAgent 不含 "SlaxReader" → false')
  })
})

describe('服务端环境', () => {
  it('isClient=false 时 getAcceptLanguage 返回 ""')
  it('isClient=false 时 isSlaxReaderApp 返回 false')
})
```

合计 13 用例（3 + 6 + 2 + 2）。

### 2.2 DwebEnvironmentAdapter.spec.ts（**6 用例**）

```
describe('DwebEnvironmentAdapter', () => {
  describe('无 iframe 构造', () => {
    it('getWindow() 返回全局 window')
    it('getDocument() 返回全局 document')
    it('getSelection() 调用全局 window.getSelection 并返回结果')
  })

  describe('传入 iframe 构造', () => {
    it('getWindow() 返回 iframe.contentWindow')
    it('getDocument() 返回 iframe.contentDocument')
    it('getSelection() 调用 iframe.contentWindow.getSelection 并返回结果')
  })
})
```

合计 6 用例。

---

## 3. mock 链路

### 3.1 environment.spec.ts

只两件事需要控制：

**A. navigator.languages / language**：**统一用 `vi.stubGlobal('navigator', { ... })` 整体替换**，afterEach `vi.unstubAllGlobals()` 还原。

> ⚠️ **不要**用 `Object.defineProperty(navigator, 'languages', { value, configurable: true })`：`vi.unstubAllGlobals()` **不会**恢复 descriptor 级别的改动，会让残留 `languages/language/userAgent` 泄漏到后续用例（codex review 第 1 轮指出）。两种方案二选一，本 sprint 选 stubGlobal。

**B. isClient / isServer 翻转**（服务端环境块）：复用 sprint 1 sprint 2 验证过的 `vi.doMock('@commons/utils/is') + vi.resetModules() + 动态 import` 模式。

### 3.2 DwebEnvironmentAdapter.spec.ts

class 没有外部依赖，**纯 happy-dom**。两件事：

- 无 iframe 用例：直接 new、断言 `adapter.getWindow() === window`
- 有 iframe 用例：`document.createElement('iframe') + document.body.appendChild(iframe)`，等 contentWindow 就绪后传入构造，断言 `adapter.getWindow() === iframe.contentWindow`

`getSelection` 用例：用 `vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection)`（无 iframe）或 spy 在 iframe.contentWindow 上。**spec 顶层加 `afterEach(() => vi.restoreAllMocks())`**——vitest config 没设 `restoreMocks: true`，spy 不会自动恢复，会泄漏到同文件后续用例（codex review 第 1 轮指出）。

---

## 4. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts`，新增：

```ts
'layers/core/app/utils/environment.ts': {
  lines: 80,
  branches: 70,
  functions: 85,
  statements: 80
},
'layers/core/app/components/Article/Selection/adapters/DwebEnvironmentAdapter.ts': {
  lines: 80,
  branches: 70,
  functions: 85,
  statements: 80
}
```

预期实测：DwebEnvironmentAdapter.ts 应 100/100/100/100；environment.ts 应 100% lines/functions/statements，但 branches 实测 ~94.44%（v8 把 `getPreferredLanguage` 中 `split(';')[0] ?? ''` 的 `?? ''` fallback 算作不可达分支，因为 `String.split` 永远返回非空数组、index 0 必有值）。**两个文件的阈值都设 80/70/85/80** 留余量，**不要求** environment.ts 必须达到 100% branches，避免施工时为了不可达的 fallback 死磕分支。

---

## 5. Sprint 3 任务拆分（1 个 task，串行）

> 由于体量小（19 用例总），不再拆 sub-sprint。

### Task 1：双 spec + 启用阈值

1. 写 `tests/unit/utils/environment.spec.ts`（13 用例）
2. 跑单文件验证 13 passed
3. 写 `tests/unit/components/Article/Selection/adapters/DwebEnvironmentAdapter.spec.ts`（6 用例）
4. 跑单文件验证 6 passed
5. 跑全量验证 145 passed (126 + 19)
6. 跑 coverage 拿 environment.ts + DwebEnvironmentAdapter.ts 实测值
7. 修改 vitest.config.ts 启用两个单文件阈值
8. 再跑 coverage 验证退出码 0

commit：`test(dweb): cover utils/environment + DwebEnvironmentAdapter, enable thresholds (sprint 3)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `vi.stubGlobal('navigator', ...)` 与 happy-dom 内置 navigator 冲突，导致测试间残留状态 | 中 | afterEach `vi.unstubAllGlobals()` 强制还原；或用 `Object.defineProperty(navigator, 'languages', { value, configurable: true })` 局部覆盖单字段，不替换整个 navigator |
| 服务端 describe 块的 `vi.doMock('@commons/utils/is') + 动态 import` 在 sprint 1 已验证可用，本 sprint 重复同款 | 低 | 沿用 request.spec.ts 的模板 |
| iframe contentWindow 在 happy-dom 下是否就绪 | 中 | iframe append 后立即同步访问 contentWindow——happy-dom 应支持，否则汇报 BLOCKED |
| `getPreferredLanguage("en;q=0.9,zh;q=0.8")` 用例：源码 split(',').map(lang => lang.trim().split(';')[0]?.toLowerCase()) → `['en', 'zh']`，循环遍历找首个 `zh` 前缀，第二个元素命中 → 返回 `'zh'`。**注意**：源码不按 q 权重排序，单纯按出现顺序找 zh。 | 低 | 预期返回 `'zh'`，**不是 `'en'`** |

---

## 7. 验收清单

- [ ] 19 用例全过（environment 13 + DwebEnvironmentAdapter 6）
- [ ] environment.ts 覆盖率 lines/functions/statements 100%、branches ≥ 80%（v8 报 ~94.44%，因 `split[0] ?? ''` fallback 不可达，超过 70% 阈值即可）
- [ ] DwebEnvironmentAdapter.ts 覆盖率 ≥ 80/70/85/80（实测应 100）
- [ ] vitest.config.ts 启用两个单文件阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 126 → 145 用例通过，0 todo / 0 fail
- [ ] sprint 1 + 2 共 77 用例（sprint 1: 23 request + sprint 2: 54 user store）无回归
- [ ] commit 英文 message

## 8. Self-Review

1. ✓ 两个被测各有自己的 spec 文件，路径镜像源码
2. ✓ navigator 覆盖用 stubGlobal + afterEach unstub（或 defineProperty + configurable: true 还原）
3. ✓ 服务端分支用 vi.doMock + 动态 import（sprint 1 已验证）
4. ✓ iframe 用例直接 createElement + appendChild 让 contentWindow 就绪
5. ✓ 阈值实施时如遇 environment.ts branches < 100（实测 ~94.44%，因 `?? ''` fallback 不可达），不必死磕——只要超过 70% 阈值即可
