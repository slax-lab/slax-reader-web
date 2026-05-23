# 第二期 Sprint 1：utils/request.ts 完整覆盖

> 第二期首战。沿用第一期已验证的 vi.hoisted + mockNuxtImport 范式，把 `layers/core/app/utils/request.ts` 的 3 个导出 + 1 个非导出 class（ServerRequest）全部覆盖到 80/70/85/80 阈值并启用本期门槛。

**Goal**：让 `request.ts` 的 `request()` 工厂、`ServerRequest` 类、`getUserToken()` / `haveRequestToken()` 获得完整测试覆盖；vitest.config 启用 request.ts 单文件阈值；同期把 §7 渐进策略表"第二期"行的目录级阈值挪到正式启用前的 staging（先观测一次 P1 模块进度再启用，避免一上来全红）。

**前置文档**：`.claude/test-framework/PLAN.md` §6.2、§7、§8 P0 第 1 项

**强制纪律**（继承第一期）：

1. 写 spec 前必须 Read 被测源码（这次还要看 `commons/utils/src/request.ts` 的 `FetchRequest` 内部）
2. 不用 `as any` / `@ts-ignore` / 过松断言绕过失败用例
3. commit message 英文，其它中文
4. 不在源代码注释/fixture/spec/log 出现 token 字符串

---

## 1. 被测面分析

`apps/slax-reader-dweb/layers/core/app/utils/request.ts`（98 行），**3 个导出 + 1 个非导出 class**：

> 注：`ServerRequest`（line 9）没有 `export` 关键字，仅在模块内被 `request()` 工厂用 `new` 实例化。**不会**为测试改源码加 export（那是公共 API 变化）——服务端分支测试通过让 `request()` 工厂走到 ServerRequest 实例化路径来覆盖。

### 1.1 `class ServerRequest extends FetchRequest`（line 9-27，模块私有）

`override async fetchRequest(options)`：

- method 不是 `get` 或者 `stream=true` → throw `'Server not support other method'`
- 否则用 `combineUrlWithQuery(url, query)` 拼 URL，原生 `fetch()` 调用
- body 为 File 直接传，否则 JSON.stringify
- headers 默认 Content-Type=application/json，可被 options.headers 覆盖

### 1.2 `request()`（line 29-74，工厂 + 单例）

- 模块级 `requestInstance` 缓存
- `baseUrl` 来自 `useRuntimeConfig().public.DWEB_API_BASE_URL`
- `isClient` 决定实例化 `FetchRequest`（客户端）还是 `ServerRequest`（服务端）
- 三个拦截器：
  - `requestInterceptors`：`getUserToken()` 有值时注入 `Authorization: Bearer <token>` header（保留原有 headers）
  - `responseInterceptors`：status === 401 → `useAuth().clearAuth()` + `navigateTo('/login')`；其它 status 透传
  - `errorInterceptors`：服务端环境直接返回 error；客户端 RequestError 走 `Toast.showToast({ text: error.message, type: Error })`，其它错误走 `Toast.showToast({ text: \`${error}\`, type: Error })`

### 1.3 `getUserToken()`（line 76-93）

- 客户端：`useCookies().get(COOKIE_TOKEN_NAME)`
- 服务端：`useRequestHeaders(['cookie']).cookie` 用正则 `/token=([^;]+)/` 解析
- COOKIE_TOKEN_NAME 来自 `useRuntimeConfig().public.COOKIE_TOKEN_NAME`

### 1.4 `haveRequestToken()`（line 95-97）

`!!getUserToken()`，简单包装。

---

## 2. 测试切分

放到 `tests/unit/utils/request.spec.ts`，分 4 个 describe 块：

### 2.1 `describe('ServerRequest')`（间接测，通过 request() 工厂走服务端实例化路径）

**改动**：审计点 1+2 修订——ServerRequest 不 export，**不能直接 new**。靠 `vi.mock('@commons/utils/is', () => ({ isClient: false, isServer: true }))` 翻转客户端/服务端判定，让 `request()` 工厂返回 ServerRequest 实例，再通过该实例调 `.fetchRequest(...)` 或更高层方法触发 `globalThis.fetch` stub 验证行为。

用例（5 个）：

- POST 请求 throw `'Server not support other method'`
- stream=true throw 同样错误
- GET + query 正确拼接 URL（验证 fetch 被调用的第一参数走过 `combineUrlWithQuery`）
- body 是 File 时直接传给 fetch
- body 是 plain object 时 JSON.stringify

### 2.2 `describe('getUserToken')`（客户端 + 服务端分支同 sprint 完成）

**改动**：审计点 2 修订——服务端分支不再 deferred，本 sprint 通过 vi.mock 翻 isServer 来覆盖。

用例（4 个）：

- 客户端 + cookies.get 返回 token → 返回该 token
- 客户端 + cookies.get 返回 undefined → 返回 undefined
- 服务端 + cookie header `'token=abc; other=x'` → 返回 `'abc'`
- 服务端 + 无 cookie header → 返回 undefined

### 2.3 `describe('haveRequestToken')`（衍生测）

用例（2 个）：

- token 存在 → true
- token 不存在 → false

### 2.4 `describe('request 单例')`（最复杂）

**关键挑战**：`request()` 内部 `new (isClient ? FetchRequest : ServerRequest)({ ... requestInterceptors, responseInterceptors, errorInterceptors })`。要测拦截器逻辑，必须能拿到这三个函数对象然后单独调它们。

**策略**：mock `@commons/utils/request` 的 `FetchRequest`，但**继承 actual class**（不是裸 vi.fn）以保留父类方法（`combineUrlWithQuery` 等），constructor 里把传入的 config 捕获到 `lastConfig` 模块变量。具体实现见 §3.1。

> 备选策略（让 request() 真跑、stub 全局 fetch + 拦截器内副作用）维护成本更高，**不采用**。

用例（12 个）：

- 第二次调 `request()` 返回同一实例（单例）
- 客户端实例化走客户端路径（断言 lastConfig.value 已被 FetchRequestMock 构造捕获，且 baseUrl 等参数符合预期）
- baseUrl 从 useRuntimeConfig 读
- requestInterceptors：有 token 时注入 `Authorization: Bearer <token>` header
- requestInterceptors：无 token 时不注入 Authorization
- requestInterceptors：原有 headers 保留
- **requestInterceptors：调用方已传 headers.Authorization 时被 token 注入值覆盖**（审计点 5：源码 `{ Authorization: ..., ...options.headers }` 顺序意味着调用方 Authorization 优先；显式断言这个行为，避免后续误改顺序）
- responseInterceptors：status 401 → clearAuth + navigateTo('/login')
- responseInterceptors：status 200 → 透传 response 不副作用
- errorInterceptors（客户端）：RequestError 走 Toast 显示 message
- errorInterceptors（客户端）：非 RequestError 走 Toast 显示 `${error}` 字符串
- errorInterceptors（服务端）：直接 return error，不调 Toast

> 注：原"服务端实例化走 ServerRequest 路径"用例已合并到 §2.1——§2.1 五个用例都是在服务端 describe 块里通过 `request().fetchRequest(...)` 触发，自然证明工厂走对了路径，无需额外用例。**ServerRequest 是模块私有 class，spec 拿不到 constructor，不用 instanceof 断言**。

合计：5（§2.1）+ 4（§2.2）+ 2（§2.3）+ 12（§2.4）= **23 个用例**。

---

## 3. mock 链路

### 3.1 FetchRequest mock：继承 actual class（审计点 3 修订）

**关键修订**：用裸 `vi.fn(function...)` 替 FetchRequest 会让 `class ServerRequest extends FetchRequest` 继承一个 mock function，丢掉 `combineUrlWithQuery` 等父类方法。改成"继承 actual class 并在 constructor 里捕获 options"：

```ts
import { vi } from 'vitest'

const lastConfig = vi.hoisted(() => ({ value: null as any }))

vi.mock('@commons/utils/request', async () => {
  const actual = await vi.importActual<typeof import('@commons/utils/request')>('@commons/utils/request')

  class FetchRequestMock extends actual.FetchRequest {
    constructor(options: any) {
      super(options)
      lastConfig.value = options
    }
  }

  return {
    ...actual, // 保留 RequestError / RequestMethodType / FetchResult 等
    FetchRequest: FetchRequestMock
  }
})
```

这样 `class ServerRequest extends FetchRequest` 仍能继承到所有真实方法，spec 通过 `lastConfig.value.requestInterceptors(...)` 直接调拦截器。

### 3.2 isClient/isServer 翻转（审计点 1+2 修订）

服务端分支测试块用：

```ts
vi.mock('@commons/utils/is', () => ({
  isClient: false,
  isServer: true
}))
```

**关键约束**：`isClient/isServer` 是模块顶层常量（`commons/utils/src/is.ts:95-97`），`request.ts` 在 import 时就把值固化进闭包。要让翻转生效，必须 **`vi.resetModules()` + 动态 import** 重新加载 `request.ts`（详见 §3.4 模块隔离）。

### 3.3 其它 mock（沿用第一期范式）

```ts
// useCookies（getUserToken 客户端分支）
const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }))
vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({ get: cookieGet })
}))

// Toast 模块（errorInterceptor 客户端分支）—— 实施时先 grep 确认 import 路径，
// request.ts:5 写的是 `import Toast, { ToastType } from '#layers/core/app/components/Toast'`
const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast },
  ToastType: { Error: 'error', Success: 'success' } // 实施时按 Toast/index.ts 真实枚举核对
}))

// useAuth（responseInterceptor 401 分支）
// 注意：request.ts 里 useAuth() 是 Nuxt auto-import（line 46 直接调用，无 import 语句），
// 必须用 mockNuxtImport 拦截；用 vi.mock('#layers/...') 拦不到 auto-import 改写后的代码
const { clearAuth } = vi.hoisted(() => ({ clearAuth: vi.fn() }))
mockNuxtImport('useAuth', () => () => ({ clearAuth }))

// Nuxt auto-import
const runtimeConfig = {
  app: { baseURL: '/' },
  public: {
    DWEB_API_BASE_URL: 'https://api.test',
    COOKIE_TOKEN_NAME: 'token'
  }
}
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const { requestHeadersMock } = vi.hoisted(() => ({ requestHeadersMock: vi.fn(() => ({})) }))
mockNuxtImport('useRequestHeaders', () => requestHeadersMock)
```

### 3.4 模块隔离策略（审计点 4 修订）

`request.ts` 顶层有 `let requestInstance: FetchRequest | null = null`（line 7）——单例缓存。如果一个 it 触发了 `request()` 创建实例，下一个 it 会拿到同一个旧实例（带旧 baseUrl / 旧拦截器引用）。

**策略**：把 spec 按 mock 配置分成 3 个独立隔离块，每块开头 `vi.resetModules()` + `await import('~~/...request')` 拿一份新副本：

```ts
describe('客户端环境', () => {
  let requestModule: typeof import('~~/layers/core/app/utils/request')
  beforeEach(async () => {
    vi.resetModules()
    // 清拦截器副作用 mock 调用记录
    showToast.mockClear()
    navigateToMock.mockClear()
    clearAuth.mockClear()
    cookieGet.mockReset().mockReturnValue(undefined)
    requestModule = await import('~~/layers/core/app/utils/request')
  })

  // ... 客户端用例（getUserToken 客户端 / haveRequestToken / request() 拦截器 / 客户端 errorInterceptor）
})

describe('服务端环境', () => {
  beforeAll(() => {
    vi.doMock('@commons/utils/is', () => ({ isClient: false, isServer: true }))
  })
  afterAll(() => {
    vi.doUnmock('@commons/utils/is')
  })

  let requestModule: typeof import('~~/layers/core/app/utils/request')
  beforeEach(async () => {
    vi.resetModules()
    requestHeadersMock.mockReset().mockReturnValue({})
    requestModule = await import('~~/layers/core/app/utils/request')
  })

  // ... 服务端用例（getUserToken 服务端 / ServerRequest fetchRequest 行为 / 服务端 errorInterceptor）
})
```

> `vi.doMock` 在 spec 运行期才生效（不会被 hoist），配合 `vi.resetModules()` 让"服务端环境" describe 块单独看到 `isServer=true` 的 request 模块。

> 警告：spec 顶层的 `vi.mock('@commons/utils/is', ...)` 会被 hoist——那是给所有用例的默认 mock；要"动态翻转"必须用 `vi.doMock`，二者不冲突。本 spec 顶层不写默认 isClient mock（让 happy-dom 真值 isClient=true 生效），仅在服务端 describe 块用 doMock 覆盖。

---

## 4. 对照 vitest.config.ts 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts`：

```ts
thresholds: {
  // 现有保留
  'layers/core/app/utils/string.ts': { lines: 90, branches: 85, functions: 90, statements: 90 },
  'layers/core/app/composables/useAuth.ts': { lines: 80, branches: 70, functions: 90, statements: 80 },

  // 第二期 sprint 1 启用：request.ts 服务端分支由 sprint 2 补上后再调高
  'layers/core/app/utils/request.ts': {
    lines: 80,
    branches: 70,
    functions: 85,
    statements: 80
  }

  // 目录级 thresholds 待 sprint 2/3 完成更多 P0 模块后再启用
}
```

---

## 5. 对照 PLAN §7 渐进策略

| 阶段                          | 全局                 | 局部                                                           | 触发节点                          |
| ----------------------------- | -------------------- | -------------------------------------------------------------- | --------------------------------- |
| 第一期                        | 注释                 | string.ts + useAuth.ts                                         | ✓ 已达成                          |
| **第二期 sprint 1（本任务）** | 注释保留             | + request.ts 单文件阈值 80/70/85/80                            | request.ts 完整覆盖 + 23 用例全过 |
| 第二期 sprint 2+              | 仍注释               | 渐进添加 stores/user / NotificationWorker / 其它 P0 单文件阈值 | 每个 P0 模块完成后                |
| 第二期 staging                | 启用全局 70/65/70/70 | 启用目录级 utils/composables/stores/components                 | 所有 P0 + 至少 50% P1 完成        |

---

## 6. Sprint 1 任务拆分（4 个 task，**串行**派发）

> 审计点：四个 spec 段都改同一个 `tests/unit/utils/request.spec.ts`，多个 subagent 并行会冲突。本 sprint 改为**单 implementer agent 串行 4 段**，每段 commit 后 controller review 一次再继续。

### Task 1：spec 骨架 + 三个 mock + describe('客户端环境') 起步

新建 `tests/unit/utils/request.spec.ts`，落 §3 mock 链路 + §3.4 模块隔离骨架（两个 describe 块的 beforeAll/beforeEach），先 `getUserToken` 客户端 2 用例 + `haveRequestToken` 2 用例 = 4 用例。验证 mock 通路 + 模块隔离能正常工作。

commit：`test(dweb): cover request.ts client-side getUserToken + haveRequestToken (sprint 1.1)`

### Task 2：补 describe('客户端环境') 内 request() 工厂相关 11 用例

§2.4 列了 12 用例，其中"errorInterceptors（服务端）：直接 return error，不调 Toast"放在服务端 describe 块（task 3），所以本 task 仅 11 个客户端用例：单例、客户端实例化、baseUrl、4 个 requestInterceptor（含审计点 5 的 Authorization 覆盖断言）、2 个 responseInterceptor、2 个客户端 errorInterceptor。

commit：`test(dweb): cover request() factory + interceptors on client (sprint 1.2)`

### Task 3：补 describe('服务端环境') 8 用例

服务端 `getUserToken` 2 用例 + ServerRequest fetchRequest 行为 5 用例（POST 抛 `'Server not support other method'` / stream=true 抛错 / GET + query 走 `combineUrlWithQuery` 拼接 URL / File body 直传 / plain object body JSON.stringify——每条单独一个 it）+ 服务端 errorInterceptor 直接 return 1 用例。合计 2 + 5 + 1 = 8。

注：服务端 `request()` 工厂走 ServerRequest 路径不单独立用例——上述 5 个 fetchRequest 行为用例都是在服务端 describe 块通过 `request().fetchRequest(...)` 调用的，自然证明工厂走对了路径。**不用 instanceof 断言**（ServerRequest 模块私有，spec 拿不到 constructor）。

> 此 task 验证 `vi.doMock('@commons/utils/is')` + `vi.resetModules()` 隔离方案是否真能切换到 isServer=true 路径。如果隔离方案有隐藏路径（happy-dom 下 typeof window 仍 truthy 等），是本 sprint 唯一可能 BLOCKED 的点——届时降级方案：本 sprint 仅记录 deferred，sprint 2 优先攻它（ServerRequest 没 export 不能旁路）。

commit：`test(dweb): cover server-side request module + ServerRequest fetchRequest (sprint 1.3)`

### Task 4：启用 vitest.config 的 request.ts 阈值 + 全量验收 + 文档回填

改 `vitest.config.ts` 启用 `'layers/core/app/utils/request.ts': { lines: 80, branches: 70, functions: 85, statements: 80 }`，跑 `pnpm test:coverage` 确认退出码 0、request.ts 覆盖率达标。回填 `.claude/test-framework/PLAN.md` §7 第二期 sprint 1 行 + §9.2 第二期增量验收点。

commit：`feat(dweb-tests): enable request.ts coverage threshold (sprint 1 done)`

---

## 7. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `vi.importActual` 拿不到 `@commons/utils/request`（pnpm workspace 路径解析问题） | 中 | spec 启动失败时手写最小复刻：`class RequestError extends Error {}` + `enum RequestMethodType { get='get', post='post', put='put', delete='delete' }` + 简化版 FetchRequest 父类 |
| Toast 模块 `import path` 与方案 §3.3 写的不一致（`#layers/...` vs `~~/layers/...`） | 中 | 实施 task 1 前 grep `request.ts:5` 确认真实 import 路径，按真实路径 mock |
| `vi.doMock + vi.resetModules` 在 happy-dom 下不能让 isServer 生效（commons/utils/src/is.ts 用 `typeof window`，window 不会被 unset） | 中 | task 3 BLOCKED 时降级：把 `getUserToken` 服务端分支用例改用 `vi.doMock('@commons/utils/is', () => ({ isClient: false, isServer: true }))` 直接喂常量；如仍不行则该 sprint 只交付客户端分支，请用户决定推迟到 sprint 2 |
| 单例缓存导致 spec 间污染 | 中（已有缓解） | §3.4 模块隔离策略：每个 it 前 `vi.resetModules()` + `await import(...)` |
| Authorization 顺序断言锁死了源码行为，未来若 request.ts 改成"调用方 Authorization 不覆盖"，测试会假阳性失败 | 低 | 用例描述写成"已知行为：调用方 headers.Authorization 优先于 token 注入"——明确标记是行为快照而非偏好 |

---

## 8. 验收清单

- [ ] 23 用例全过（5 ServerRequest + 4 getUserToken + 2 haveRequestToken + 12 request 工厂/拦截器）
- [ ] request.ts 覆盖率 ≥ 80/70/85/80（来自 coverage-summary.json）
- [ ] vitest.config.ts 启用 request.ts 阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 49 → 72 用例（49 + 23）通过
- [ ] PLAN.md §7 第二期 sprint 1 行回填、§9.2 第二期增量验收点新增
- [ ] commit 全英文 message，分 4 commits（task 1.1/1.2/1.3 + sprint 1 done）
- [ ] 服务端环境分支可正常切换（task 3 验证 vi.doMock + vi.resetModules 通路；如失败按 §7 降级方案处理）

## 9. Self-Review（修订后）

两轮审计触发的修订点本方案已全部纳入：

**第一轮（5 点）**：

1. ✓ ServerRequest 不 export 的事实已纳入 §1 + §2.1，靠 request() 工厂走服务端实例化路径间接覆盖
2. ✓ 服务端分支不再 deferred，§2.2 / §3.2 / §3.4 / §6 task 3 全部贯穿
3. ✓ FetchRequest mock 改成"继承 actual class"，§3.1
4. ✓ 模块隔离策略明确：vi.resetModules + 动态 import + 双 describe 块（客户端/服务端），§3.4
5. ✓ Authorization 覆盖顺序补显式断言，§2.4 第 7 条用例

**第二轮（3 点）**：

6. ✓ useAuth 改用 mockNuxtImport（§3.3）—— request.ts:46 `useAuth()` 是 nuxt auto-import，与 useAuth.spec.ts 模式一致
7. ✓ ServerRequest 不写 instanceof 断言，靠 `fetchRequest({ method: 'post' })` 抛错 + GET URL 拼接行为间接证明走的是服务端实例（§2.1 + §2.4 + §6 task 3）
8. ✓ 用例数量同步对齐：§2.4 12 + §2.1 5 + §2.2 4 + §2.3 2 = 23 用例；task 1 拆 4 + task 2 拆 11 + task 3 拆 8 = 23（§6）；验收清单 §8 也同步
