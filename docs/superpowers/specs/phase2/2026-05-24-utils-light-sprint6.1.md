# 第二期 Sprint 6.1：剩余轻量 utils 完整覆盖

> 第二期第六个 sprint 第一段。覆盖 utils/ 目录剩余 5 个轻量纯函数文件，让整个 utils/ 目录覆盖率达到目录级阈值，**为启用 utils/** 90/85/90/90 目录级阈值铺路\*\*。

**Goal**：utils/{analytics,channel,userRelative,zip}.ts **4 个文件**全部覆盖到阈值并启用单文件门槛。pwa.ts 因 `useNuxtApp().$pwa` configurable=false 不能 mock，已**推迟到第三期 e2e**（详见 §1.2）。Sprint 6.2 再做 chatbot.ts（PLAN P0 ChatBot 链路）。

**前置文档**：

- `.claude/test-framework/PLAN.md` §7 第二期目录级阈值（待启用）
- 沉淀范式：sprint 1-5 全套（vi.hoisted + mockNuxtImport + vi.spyOn + vi.stubGlobal）

**强制纪律**（继承）：

1. 写 spec 前必须 Read 被测源码
2. 不用 `as any` / `@ts-ignore` / 过松断言
3. commit message 英文
4. spec 落盘后过 codex-review-loop.sh 多轮 review

---

## 1. 被测面分析

### 1.1 `utils/userRelative.ts`（5 行）—— stub 占位

```ts
export const checkUserSubscribedIsExpired = (user: UserInfo) => {
  return false
}
```

**用例**：1 个——"传任意 UserInfo 都返回 false"，锁住占位行为。Sprint 5 已间接覆盖（isSubscriptionExpired 的 user!=null 用例），本 sprint 单独直测让 functions 不再因这个空函数被算未调用。

### 1.2 `utils/pwa.ts`（10 行，**本 sprint 推迟**）

```ts
export const pwaOpen = (options: { url: string; target?: string }) => {
  const { $pwa } = useNuxtApp()
  if ($pwa?.isPWAInstalled) {
    navigateTo(options.url, { external: isUrl(options.url) })
  } else {
    window.open(options.url, options.target || '_blank')
  }
}
```

**决策**（codex review 第 1 轮 P1 + 用户裁定）：**本 sprint 不测 pwa.ts**。

理由：codex 实测验证 nuxt-test-utils 4 下 `useNuxtApp().$pwa` 是 `configurable: false` 的 getter，`Object.defineProperty(nuxtApp, '$pwa', ...)` 直接抛 `Cannot redefine property`。其它替代方案要么破坏 setupNuxt（vi.mock useNuxtApp 同 sprint 2.2 已知约束），要么需重构生产代码（抽 `getPwa()` helper，用户判断 ROI 不值）。

pwa.ts 仅 10 行、3 个分支，留待第三期 e2e 验证。

### 1.3 `utils/zip.ts`（38 行，仅 `unzipGetFile` 导出）

```ts
const unzipGetFile = async (file: File, matchRule: RegExp): Promise<File[] | undefined> => {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const fileContent = await zip.loadAsync(file)
  // ... 遍历 zip entries，跳过 __MACOSX/, ./_，匹配 matchRule，转 File
}
```

`getMimeType` 是私有函数（无 export），被 unzipGetFile 内部用。

**用例**（5 个）：

1. zip 含匹配文件 → 返回 File[] 含一项，`type` 按扩展名得对应 mime（如 `.png` → `'image/png'`）
2. zip 含 `__MACOSX/` 路径文件 → 跳过
3. zip 含 `/._` 隐藏文件 → 跳过
4. matchRule 不匹配的文件 → 跳过
5. zip 无匹配文件 → 返回空数组

**关键约束**：`jszip` 是 dynamic import，spec 用 `vi.mock('jszip')` 替成 stub，让 `loadAsync` 返回受控 `{ files: { ... } }` 对象，每个 zipEntry 的 `async('arraybuffer')` 返回固定 ArrayBuffer。

### 1.4 `utils/channel.ts`（73 行）

3 个导出 + 模块级单例 BroadcastChannel：

```ts
const channel = isClient ? new BroadcastChannel('slax-reader-dweb') : null
channel && (channel.onmessage = async (event: MessageEvent) => { ... })

export const postChannelMessage = ...
export const addChannelMessageHandler = ...
export const removeChannelMessageHandler = ...
```

**用例**（9 个）：

1. `addChannelMessageHandler` 添加 handler → handlers 含该 handler
2. 添加重复 handler → 不重复加
3. `removeChannelMessageHandler` 移除存在的 handler → handlers 不再含
4. removeChannelMessageHandler 移除不存在的 handler → handlers 不变（不抛错）
5. `postChannelMessage('archive', { id: 1, cancel: false })` → channel.postMessage 收到 `{ name: 'archive', data: { archive: { id: 1, cancel: false } } }`
6. channel.onmessage 触发，sync handler 被调
7. channel.onmessage 触发，async handler 被 await
8. channel.onmessage 收到 event.data 为空 → 不调 handlers
9. **window 'close' 事件触发 → channel.close() 被调**（codex review 第 3 轮 P1：v8 把这个 arrow callback 算 channel.ts 第 5 个函数，不测会让 functions 覆盖率掉到 80% < 85% 阈值）

**关键约束**：BroadcastChannel 是模块顶层 new 出来，spec 必须在被测模块加载前替换全局 BroadcastChannel。**正解**：在每个 it 的 `beforeEach` 内调 `vi.stubGlobal('BroadcastChannel', class { ... })`，紧跟 `vi.resetModules()` + 动态 import，让模块顶层 `new BroadcastChannel(...)` 拿到 stub 实例；`afterEach` 调 `vi.unstubAllGlobals()` 还原。**禁止**把 stubGlobal 放在 spec 顶层一次性调用——afterEach unstub 后下个 it 的 beforeEach 不重新 stub 会让动态 import 拿到 happy-dom 真实 BroadcastChannel，断言失效。详见 §3.4 完整模板。

### 1.5 `utils/analytics.ts`（72 行）

2 个导出：

- `analyticsLog(params)`：拼 enrichedParams + 调 useScriptGoogleTagManager().proxy.dataLayer.push；try/catch 兜底打 console.error
- `firebaseAnalyticsLog(params)`：isServer 早退 + lazy initializeApp + getAnalytics + logEvent；try/catch 兜底

**用例**（7 个）：

1. analyticsLog 正常路径 → dataLayer.push 收到 { event, platform, version }
2. analyticsLog config.public.appVersion 缺失 → fallback `'unknown'`
3. analyticsLog useScriptGoogleTagManager 抛错 → console.error 被调，不抛出
4. firebaseAnalyticsLog isServer=true → 早退（不调 initializeApp）
5. firebaseAnalyticsLog 首次调用 → initializeApp + getAnalytics + logEvent 都被调
6. firebaseAnalyticsLog 第二次调用 → analytics 单例已有，**不**再调 initializeApp
7. firebaseAnalyticsLog initializeApp 抛错 → console.error 被调，不抛出

**关键约束**：

- `useScriptGoogleTagManager` 是 nuxt auto-import → mockNuxtImport
- `useRuntimeConfig` 同样 mockNuxtImport（sprint 1+2 范式）
- `firebase/app` + `firebase/analytics` 是 npm 包：**已在 sprint 1 setup/globalMocks.ts 全局 mock**，但 globalMocks 没 mock `firebase/analytics`（只 mock 了 firebase/app + firebase/messaging）—— 需要本 spec 内显式 `vi.mock('firebase/analytics', ...)`
- `@commons/utils/is` 的 isClient 翻转：sprint 1 范式（vi.doMock + vi.resetModules + 动态 import）
- 单例缓存：`analytics` 是模块级 `let analytics: Analytics | null = null` —— 与 sprint 1 request.ts requestInstance 同理，每个 it 前 vi.resetModules 拿新模块

合计 sprint 6.1：1 + 5 + 9 + 7 = **22 用例**（pwa.ts 4 用例已推迟到第三期，详见 §1.2；channel +1 用例覆盖 close listener，详见 §1.4 第 9 条）。

---

## 2. 测试切分

4 个独立 spec 文件（小文件各 1 个，路径镜像源码）：

- `tests/unit/utils/userRelative.spec.ts`（1 用例）
- `tests/unit/utils/zip.spec.ts`（5 用例）
- `tests/unit/utils/channel.spec.ts`（9 用例）
- `tests/unit/utils/analytics.spec.ts`（7 用例）

> 不合并到一个 spec 文件——每个文件 mock 链路差异大（zip 要 mock jszip、analytics 要 mock firebase、channel 要 stubGlobal BroadcastChannel）。一个 spec 一份独立 mock 配置最干净。pwa.spec.ts 本 sprint 不写（§1.2 推迟）。

---

## 3. mock 链路（按文件）

### 3.1 userRelative.spec.ts

无外部依赖，纯 import + 调用 + 断言。

### 3.2 pwa.spec.ts（**本 sprint 不实施，详见 §1.2**）

跳过——nuxt-test-utils 4 的 `useNuxtApp().$pwa` configurable=false 不能 defineProperty，留待第三期 e2e。

### 3.3 zip.spec.ts

```ts
const { jszipMock, loadAsyncMock, makeZipEntry } = vi.hoisted(() => {
  const loadAsyncMock = vi.fn()
  const makeZipEntry = (filename: string, buffer: ArrayBuffer) => ({
    async: vi.fn(async (type: string) => buffer)
  })
  const JSZipMock = vi.fn(() => ({ loadAsync: loadAsyncMock }))
  return { jszipMock: { default: JSZipMock }, loadAsyncMock, makeZipEntry }
})

vi.mock('jszip', () => jszipMock)

import { unzipGetFile } from '~~/layers/core/app/utils/zip'

it('zip 含匹配文件 → 返回 File[]', async () => {
  const buffer = new ArrayBuffer(8)
  loadAsyncMock.mockResolvedValueOnce({
    files: { 'image.png': makeZipEntry('image.png', buffer) }
  })
  const file = new File([new ArrayBuffer(0)], 'archive.zip', { type: 'application/zip' })
  const result = await unzipGetFile(file, /\.png$/)
  expect(result).toHaveLength(1)
  expect(result![0]?.name).toBe('image.png')
  expect(result![0]?.type).toBe('image/png')
})
```

### 3.4 channel.spec.ts

```ts
const { postMessageMock, closeMock, registeredOnmessage, capturedCloseHandler } = vi.hoisted(() => ({
  postMessageMock: vi.fn(),
  closeMock: vi.fn(),
  registeredOnmessage: { handler: null as ((e: MessageEvent) => void) | null },
  capturedCloseHandler: { handler: null as (() => void) | null }
}))

class BroadcastChannelStub {
  constructor(public name: string) {}
  set onmessage(h: (e: MessageEvent) => void) {
    registeredOnmessage.handler = h
  }
  postMessage = postMessageMock
  close = closeMock
}

let channelModule: typeof import('~~/layers/core/app/utils/channel')
let originalAddEventListener: typeof window.addEventListener

beforeEach(async () => {
  // **关键 1**（codex review 第 1/2 轮 P2）：stubGlobal 必须每个 it 重新执行——
  // afterEach `vi.unstubAllGlobals()` 之后顶层 stub 已被清，下一个 it 的 beforeEach
  // 重新 stub 才能让动态 import 拿到新 BroadcastChannel 实例
  vi.stubGlobal('BroadcastChannel', BroadcastChannelStub)

  // **关键 2**（codex review 第 5 轮 P2）：channel.ts 模块顶层注册了
  // window.addEventListener('close', ...) listener；vi.resetModules() 不会移除
  // 已注册的 window listener，多次 import 会累积 listener。本 spec 用 spy 拦
  // window.addEventListener 捕获每次 import 注册的 close handler，close 用例
  // **直接调** capturedCloseHandler.handler() 而非 window.dispatchEvent('close')，
  // 避免累积 listener 重复触发 closeMock。
  capturedCloseHandler.handler = null
  vi.spyOn(window, 'addEventListener').mockImplementation((type: string, listener: EventListener) => {
    if (type === 'close' && typeof listener === 'function') {
      capturedCloseHandler.handler = listener as () => void
    }
  })

  vi.resetModules()
  postMessageMock.mockReset()
  closeMock.mockReset()
  registeredOnmessage.handler = null
  channelModule = await import('~~/layers/core/app/utils/channel')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// close 用例典型用法：
//   it('window 'close' 事件 → channel.close() 被调', () => {
//     expect(capturedCloseHandler.handler).toBeTruthy()
//     capturedCloseHandler.handler!()
//     expect(closeMock).toHaveBeenCalledTimes(1)
//   })
```

### 3.5 analytics.spec.ts

```ts
const { dataLayerPushMock, useScriptGoogleTagManagerMock, initializeAppMock, getAnalyticsMock, logEventMock } = vi.hoisted(() => ({
  dataLayerPushMock: vi.fn(),
  useScriptGoogleTagManagerMock: vi.fn(() => ({ proxy: { dataLayer: { push: dataLayerPushMock } } })),
  initializeAppMock: vi.fn(() => ({
    /* fake app */
  })),
  getAnalyticsMock: vi.fn(() => ({
    /* fake analytics */
  })),
  logEventMock: vi.fn()
}))

mockNuxtImport('useScriptGoogleTagManager', () => useScriptGoogleTagManagerMock)
mockNuxtImport('useRuntimeConfig', () => () => ({
  // **关键**：必须保留 app: { baseURL: '/' }——sprint 1+2 已验证 nuxt-test-utils
  // 的 router plugin 在 init 期读 useRuntimeConfig().app.baseURL，缺失会让
  // setupNuxt 报 "Cannot read properties of undefined (reading 'afterEach')"
  app: { baseURL: '/' },
  public: { appVersion: '1.0.0', FIREBASE_API_KEY: 'k' /* ... */ }
}))

vi.mock('firebase/app', () => ({ initializeApp: initializeAppMock }))
vi.mock('firebase/analytics', () => ({
  getAnalytics: getAnalyticsMock,
  logEvent: logEventMock
}))

// isServer 翻转用例：vi.doMock('@commons/utils/is') + vi.resetModules（sprint 1 范式）
```

> 注意：sprint 1 setup/globalMocks.ts 已 mock firebase/app（getApps + initializeApp 都是 vi.fn()）。本 spec 内 vi.mock 会**覆盖** globalMocks 的注册（vitest mock 后写优先），无冲突。

---

## 4. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts` 在现有 thresholds 块**追加**：

```ts
'layers/core/app/utils/userRelative.ts': { lines: 80, branches: 70, functions: 85, statements: 80 },
'layers/core/app/utils/zip.ts': { lines: 80, branches: 70, functions: 85, statements: 80 },
'layers/core/app/utils/channel.ts': { lines: 80, branches: 70, functions: 85, statements: 80 },
'layers/core/app/utils/analytics.ts': { lines: 80, branches: 70, functions: 85, statements: 80 }
```

预期实测：4 个文件全 100 全维度（除 channel.ts 的 `window?.addEventListener('close', ...)` 可能算不可达分支，类似 sprint 3 environment.ts）。

> **不**启用 utils/** 目录级阈值——chatbot.ts 还没测（sprint 6.2 才做），且 pwa.ts 第三期才补。**等 sprint 6.2 完成 chatbot.ts 后**再启用 `'layers/core/app/utils/**': 90/85/90/90` 目录级阈值（pwa.ts 仍单独 exclude 或留待第三期补完阈值）。

---

## 5. Sprint 6.1 任务拆分（2 个 task 串行）

> 4 个文件分两个 task：体量小的合一组、需要新基础设施的独立。

### Task 1：2 个最简文件（userRelative + zip）= 6 用例

新建 2 个 spec 文件，分别落 mock 链路（userRelative 无 mock、zip 用 vi.mock jszip）。

commit：`test(dweb): cover utils/userRelative + zip (sprint 6.1.1)`

### Task 2：channel + analytics（最复杂）= 16 用例 + 启用阈值

- channel 需要 stubGlobal BroadcastChannel + vi.resetModules 模式（**stubGlobal 必须放 beforeEach 内**，配合 afterEach unstub 配对）
- analytics 需要 mock firebase/analytics + 复用 sprint 1 isServer 翻转范式

commit：`test(dweb): cover utils/channel + analytics, enable thresholds (sprint 6.1.2)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| pwa.ts 的 `useNuxtApp().$pwa` 用 `Object.defineProperty` 替换可能不工作（nuxtApp 是 Proxy） | 高 | 实施时先单 it 验证；如不行，**整个 pwa.ts spec 推迟到第三期**（10 行代码 ROI 低，不值得为此引入复杂 mock） |
| zip.ts 的 dynamic import jszip 在 vitest mock 下能否被拦 | 中 | sprint 1 验证过 vi.mock 对 dynamic import 有效；如失败先汇报 |
| channel.ts 模块顶层 `window?.addEventListener('close', ...)` 在 happy-dom 下：window 存在但 'close' 不是常规事件，addEventListener 不抛错 | 低 | 不为这行写用例，coverage 报告里这行可能算未覆盖（与 environment.ts `?? ''` 同理） |
| analytics.ts 的 `useScriptGoogleTagManager` 在 nuxt-test-utils 下是否 auto-import | 中 | 实施时先 grep 确认；如不是 auto-import 改用 vi.mock |
| 5 个 spec 间 vi.stubGlobal / vi.doMock 互相干扰 | 中 | 每个 spec 独立文件、afterEach restoreAllMocks + unstubAllGlobals；spec 间天然隔离（vitest 默认每个 test file 独立 worker） |

---

## 7. 验收清单

- [ ] 22 用例全过（Task 1: 6 + Task 2: 16）
- [ ] 4 个文件覆盖率全 ≥ 80/70/85/80（实测期望全 100；channel.ts 9 用例已含 close listener 覆盖，确保 functions 5/5 = 100% > 85% 阈值）
- [ ] vitest.config.ts 启用 4 个单文件阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 189 → 211 用例通过，0 todo / 0 fail
- [ ] sprint 1-5 共 165 用例（不含本批 22）无回归
- [ ] commit 全英文 message，分 2 commits
- [ ] spec 过 codex-review-loop.sh 多轮全通过

## 8. Self-Review

1. ✓ 4 个文件各 1 spec，路径镜像源码（与 sprint 3 双 spec 同范式；pwa.spec.ts 第 5 个 spec 已推迟到第三期）
2. ✓ pwa.ts $pwa configurable=false 已 codex 实测验证不可 defineProperty，本 sprint 不写 spec
3. ✓ zip 的 jszip / analytics 的 firebase 都用 vi.mock 拦
4. ✓ channel 的 BroadcastChannel 用 stubGlobal + vi.resetModules（**stubGlobal 必须在 beforeEach 内**，sprint 1 范式 + codex 第 1/2 轮修订）
5. ✓ analytics 的 isServer 翻转用 vi.doMock + 动态 import（sprint 1 范式）；mock useRuntimeConfig 必须保留 `app: { baseURL: '/' }`
6. ✓ channel close 用例用**直接调 onclose handler**而非 window.dispatchEvent（避免 vi.resetModules 累积的 listener 重复触发，详见 §3.4 修订模板）
7. ✓ 不启用目录级阈值——等 sprint 6.2 完成 chatbot.ts 后再统一启用
