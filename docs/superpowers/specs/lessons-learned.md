# dweb 测试框架施工期遇到的问题与解决方案

> 本文档记录第一期 + 第二期施工过程中遇到的技术问题、根因分析和解决方案。总结报告（`summary-phase1-2.md`）引用本文档。

---

## 1. Nuxt auto-import 无法用 vi.mock 路径拦截

**发现时机**：Sprint 1 Task 9（useAuth 样板）

**问题描述**：dweb 业务代码（useAuth.ts、Homepage.vue 等）调用 `request()` 走 **Nuxt auto-import**（无显式 import 语句）。原计划用 `vi.mock('~~/layers/core/app/utils/request', ...)` 拦截，实测完全无效——auto-import 编译后绑定到不同路径，vi.mock 路径不匹配。

**根因**：Nuxt 在构建时把 auto-import 改写成具体的导入绑定，`vi.mock` 的路径字符串匹配不到改写后的绑定。

**解决方案**：

- auto-import 函数（`request` / `navigateTo` / `useRuntimeConfig` / `useRequestHeaders` 等）一律用 `mockNuxtImport('name', () => mockFn)` 拦截
- spy 必须在同文件 `vi.hoisted` 内声明（不能跨文件 import binding，TDZ 约束）
- 显式 import 路径（如 `DwebHttpClient.ts` 用 `#layers/...`）仍可用 `vi.mock`

**沉淀位置**：`tests/README.md` §"Nuxt auto-import 怎么 mock"

---

## 2. mockNuxtImport 是 macro，factory 内不能引用跨文件 binding

**发现时机**：Sprint 1 Task 9（useAuth 样板）

**问题描述**：设计文档原计划把 `mockRequest` 等 spy 句柄放在 `tests/mocks/request.ts` 里，让各 spec 直接 import 后传给 `mockNuxtImport('request', () => mockRequest)`。实测报错：`mockNuxtImport` 被 transform 成 `vi.mock` 后 hoist 到文件顶部，此时跨文件 import 的 binding 仍在 TDZ。

**根因**： `mockNuxtImport` 是 vitest macro，被 hoist 后执行时机早于 import 语句，跨文件 spy 引用不可用。

**解决方案**：每个 spec 在自己文件内用 `vi.hoisted` 声明 spy，再传给 `mockNuxtImport`。`tests/mocks/request.ts` 仅服务于"显式 import 路径"场景。

---

## 3. mockNuxtImport('useNuxtApp', ...) 破坏 setupNuxt 初始化

**发现时机**：Sprint 2.2 Task 1（user store request 类 actions）

**问题描述**：尝试 `mockNuxtImport('useNuxtApp', () => () => ({ $i18n: { setLocale: mockFn } }))` 替换整个 useNuxtApp，导致 nuxt-test-utils 的 pinia payload-plugin 在 init 期读 `nuxtApp.skipHydrate` 时报 `Cannot set properties of undefined`，整个 spec 文件 suite fail。

**根因**：nuxt-test-utils 4 的 setupNuxt 内部依赖真实 nuxtApp 实例（skipHydrate / deferHydration 等），替换整个 useNuxtApp 会破坏这些内部调用。

**解决方案**：不替换整个 useNuxtApp，改用 `vi.spyOn(useNuxtApp().$i18n, 'setLocale')` 局部 spy——拿到真实 nuxtApp 实例后只替换需要的方法。

---

## 4. vi.mock('vue', { createApp: vi.fn() }) 破坏 setupNuxt

**发现时机**：Sprint 4 Task 1（modal bootloader）

**问题描述**：mock `vue.createApp` 让它默认返回 undefined，导致 setupNuxt 在 spec 加载时调 createApp 时报 `Object.defineProperty called on non-object`，全部用例 skip。

**根因**：nuxt-test-utils 的 setupNuxt 在 spec 加载早期就调 `createApp(...)` 初始化 Nuxt 应用，默认 undefined 返回值让后续 defineProperty 崩溃。

**解决方案**：vi.mock factory 内通过 ref 捕获 `actual.createApp`，createAppMock 默认委派给 actual；用例需要受控 stub 时调 `mockImplementationOnce(() => stub)`。

```ts
const { actualCreateAppRef, createAppMock } = vi.hoisted(() => {
  const actualCreateAppRef: { value: ((...args: unknown[]) => unknown) | null } = { value: null }
  const createAppMock = vi.fn((...args) => actualCreateAppRef.value!(...args))
  return { actualCreateAppRef, createAppMock }
})
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  actualCreateAppRef.value = actual.createApp as unknown as (...args: unknown[]) => unknown
  return { ...actual, createApp: createAppMock }
})
```

---

## 5. useNuxtApp().$pwa 是 configurable: false，不能 defineProperty

**发现时机**：Sprint 6.1 spec 审查（codex review 第 1 轮 P1）

**问题描述**： `pwa.ts` 内部调 `useNuxtApp().$pwa`，尝试用 `Object.defineProperty(nuxtApp, '$pwa', { configurable: true, get: () => ... })` 替换，直接抛 `Cannot redefine property: $pwa`。

**根因**：nuxt-test-utils 4 把 `$pwa` 注册为 `configurable: false` 的 getter，无法被 defineProperty 覆盖。

**解决方案**： `pwa.ts` 推迟到第三期 e2e 测试（10 行代码 ROI 低，不值得引入复杂 mock）。coverage exclude 中加入 `pwa.ts`。

---

## 6. vi.stubGlobal 必须在 beforeEach 内（不能放顶层）

**发现时机**：Sprint 6.1 channel.spec.ts（codex review 第 1 轮 P2）

**问题描述**：顶层调用 `vi.stubGlobal('BroadcastChannel', ...)` 一次，afterEach 调 `vi.unstubAllGlobals()`。第一个用例结束后 stub 被清，后续 beforeEach 重新 import channel.ts 时拿到的是真实/Node 的 BroadcastChannel，mock 不生效。

**根因**： `vi.unstubAllGlobals()` 会清除所有 stubGlobal，顶层 stub 只执行一次，之后每个 it 都在"无 stub"状态下 import 模块。

**解决方案**：把 `vi.stubGlobal(...)` 移到 `beforeEach` 内，与 `vi.resetModules()` + 动态 import 配对，确保每个 it 都在 stub 生效后加载模块。

---

## 7. vi.resetModules 不清 window listener，导致 listener 累积

**发现时机**：Sprint 6.1 channel.spec.ts（codex review 第 5 轮 P2）

**问题描述**： `channel.ts` 模块顶层注册 `window.addEventListener('close', ...)` listener。每次 `vi.resetModules()` + 动态 import 都会重新注册一个新 listener，但旧 listener 不会被清除。close 用例如果用 `window.dispatchEvent(new Event('close'))` 触发，会触发所有累积的 listener，导致 `closeMock` 被调用多次，精确调用次数断言失败。

**根因**： `vi.resetModules()` 只清模块缓存，不清已注册的 DOM 事件 listener。

**解决方案**：用 `vi.spyOn(window, 'addEventListener')` 拦截 close 类型注册，把 listener 引用捕获到 `capturedCloseHandler.handler`，close 用例直接调用 `capturedCloseHandler.handler()` 而非 `dispatchEvent`。

---

## 8. vi.fn(箭头函数) 不能 new

**发现时机**：Sprint 6.1 Task 1（zip.spec.ts）

**问题描述**： `vi.fn(() => ({ loadAsync: ... }))` 作为 JSZip 构造函数 mock，但 `new JSZipMock()` 报错——箭头函数不能被 `new` 调用。

**根因**：ES6 箭头函数没有 `[[Construct]]` 内部方法，不能作为构造函数。

**解决方案**：改用普通函数：`vi.fn(function() { return { loadAsync: ... } })`。

---

## 9. SSEDecoder stub 与真实行为不一致（假阳性风险）

**发现时机**：Sprint 6.2 spec 审查（codex review 第 1 轮 P1）

**问题描述**：原计划用简化 stub class 替换 SSEDecoder，stub 在收到 `data: ...\n` 单换行时就 emit 事件。但真实 SSEDecoder 必须收到**空行**（`\n\n` 双换行）才 emit ServerSentEvent。用 stub 的测试会假阳性通过，而真实 streaming 路径不会触发 handleData。

**根因**：SSE 协议规定消息以空行结束，真实 SSEDecoder 严格遵守。简化 stub 跳过了这个协议细节。

**解决方案**：直接 import 真实 `LineDecoder` + `SSEDecoder`（来自 `@commons/utils/decoder`，纯逻辑无外部依赖），不 mock。用例按真实 SSE 协议构造 chunk：`data: <json>\n\n`（双换行结束消息）。

---

## 10. chat() async resolve 时机是 subscriber 注册，不是 done 完成

**发现时机**：Sprint 6.2 spec 审查（codex review 第 1 轮 P2）

**问题描述**：原计划 `await chatPromise` 等待 done 路径（lineDecoder.flush + updateChatStatus(false)）完成后再断言。但 `chat()` 在调 `request().stream({...})` 拿到 callback 后**立即 resolve**，done 路径是 subscriber 被调时同步触发的，不是 chatPromise resolve 时。

**根因**： `chat()` 的 async 语义是"等到 stream 注册完成"，不是"等到流式传输结束"。

**解决方案**： `await chatbot.chat(...)` 仅等 subscriber 注册；done 副作用由 `subscriber('', true)` 同步触发，无需 await chatPromise。

---

## 11. vi.hoisted 内的 class 声明不能被 vi.mock factory 引用（TDZ）

**发现时机**：Sprint 6.2 spec 审查（codex review 第 1 轮 P1）

**问题描述**：原计划在 spec 顶层声明 `class LineDecoderStub` / `class SSEDecoderStub`，然后在 `vi.mock('@commons/utils/decoder', () => ({ LineDecoder: LineDecoderStub, ... }))` factory 内引用。vi.mock factory 被 hoist 到文件顶部，此时顶层 class 声明仍在 TDZ，报 ReferenceError。

**根因**：vi.mock factory 被 hoist 到文件最顶部执行，早于任何顶层声明（包括 class）。

**解决方案**：把 class 定义放在 vi.mock factory 内部，或通过 `vi.hoisted` 返回。本 sprint 最终决策是直接用真实 decoder（见问题 9），绕过了这个问题。

---

## 12. stores/user.ts state() 工厂调 useI18n()，必须 mock

**发现时机**：Sprint 2.1 Task 1（user store getters）

**问题描述**： `useUserStore()` 初始化时 `state.locale: useI18n()?.locale?.value`（user.ts:54），在 spec 内直接 `setActivePinia(createPinia())` 后调 `useUserStore()` 会报 `useI18n must be called from inside a setup function`。

**根因**：Pinia store 的 state() 工厂在首次 `useUserStore()` 时执行，此时没有 Vue setup 上下文，useI18n 报错。

**解决方案**：在 spec 顶层 `mockNuxtImport('useI18n', () => () => ({ locale: { value: 'en' } }))` 提供 mock 返回值。

---

## 13. vi.mock factory 内 vi.fn 句柄的 TDZ 问题

**发现时机**：Sprint 1 Task 1（setup 五件套）

**问题描述**： `vi.mock` factory 内引用顶层 `const cookieSet = vi.fn()` 等变量，vi.mock 被 hoist 后这些变量还未初始化，报 `Cannot access 'cookieSet' before initialization`。

**根因**：vi.mock 被 hoist 到文件顶部，顶层 const 声明在 hoist 后仍在 TDZ。

**解决方案**：用 `vi.hoisted(() => ({ cookieSet: vi.fn(), ... }))` 显式包装所有 mock factory 内需要引用的变量，vi.hoisted 的结果在 vi.mock 运行前已就绪。

---

## 14. request() 工厂返回链式方法，vi.fn() 默认 undefined 导致 .post 报错

**发现时机**：Sprint 1 spec 设计审查（第 5 轮审计）

**问题描述**：业务代码用 `request().post(...)` 链式调用，如果 `mockRequest = vi.fn()` 默认返回 undefined，`undefined.post` 直接报 `Cannot read properties of undefined`。

**根因**： `request()` 是工厂函数，返回 FetchRequest 实例（含 get/post/put/delete 等方法）。vi.fn() 默认返回 undefined，不是对象。

**解决方案**： `mockRequest = vi.fn(() => ({ post: mockPost, get: mockGet, ... }))` 让 mock 工厂返回挂好方法的对象。

---

## 15. BookmarkDetail.starred / archived 是字符串字面量，不是 boolean

**发现时机**：Sprint 5 spec 审查（codex review 第 1 轮 P2）

**问题描述**：fixture 里写 `starred: false` / `archived: false`，但真实接口是 `starred: 'star' | 'unstar'` / `archived: 'inbox' | 'archive' | 'later'`。用 boolean 构造的 fixture 会让 type guard 用例假阳性通过（`in` 操作符只检查字段存在，不检查值类型）。

**根因**：设计文档没有核对真实接口字段类型，凭直觉写了 boolean。

**解决方案**：施工前必须 Read `commons/types/src/interface.ts` 核对真实字段类型，fixture 用真实字面量值（`'inbox'` / `'unstar'` 等）。

---

## 16. codex review 发现的 v8 coverage 计数细节

**发现时机**：Sprint 6.1 channel.spec.ts（codex review 第 3 轮 P1）

**问题描述**：channel.ts 顶层注册了 `window.addEventListener('close', () => channel.close())` 匿名 arrow callback，v8 把它算作一个独立 function。原计划 8 个用例不覆盖这个 callback，导致 functions 4/5 = 80% < 阈值 85%，coverage 必红。

**根因**：v8 coverage 把模块顶层的每个 arrow function 都算作独立 function，即使它是 addEventListener 的匿名回调。

**解决方案**：补第 9 个用例覆盖 close listener（用 spy 拦 addEventListener 捕获 handler 引用，直接调用）。

---

## 17. analytics.ts 的 useScriptGoogleTagManager 是否 auto-import

**发现时机**：Sprint 6.1 analytics.spec.ts 施工

**问题描述**：不确定 `useScriptGoogleTagManager` 是 Nuxt auto-import 还是显式 import，选错 mock 方式会导致拦截失败。

**解决方案**：实施前 grep 确认：`grep -n "import.*useScriptGoogleTagManager" analytics.ts` 无输出 → 是 auto-import → 用 `mockNuxtImport`。

---

## 18. useRuntimeConfig mock 必须保留 app.baseURL

**发现时机**：Sprint 1 useAuth.spec.ts + Sprint 6.1 analytics.spec.ts（codex review 第 2 轮 P2）

**问题描述**：mock `useRuntimeConfig` 时只提供 `public` 字段，缺少 `app: { baseURL: '/' }`，导致 nuxt-test-utils 的 router plugin 在 init 期读 `useRuntimeConfig().app.baseURL` 时报 `Cannot read properties of undefined (reading 'afterEach')`。

**根因**：nuxt-test-utils 4 的 router plugin 在 setupNuxt 阶段读 `app.baseURL`，缺失会让 `useRouter()` 返回 undefined，后续 `useRouter().afterEach(...)` 崩溃。

**解决方案**：所有 `mockNuxtImport('useRuntimeConfig', ...)` 的 mock 对象必须包含 `app: { baseURL: '/' }`。
