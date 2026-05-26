# 第二期 Sprint 2.2：stores/user.ts request 类 + 复合 action 覆盖

> Sprint 2 拆分第二段。覆盖 sprint 2.1 推迟的 9 个 action：4 个调 request + 3 个复合 + 2 个调 useCookies/useNuxtApp 的本地副作用。完成后启用 user.ts 单文件阈值 80/70/85/80。

**Goal**：补完 user store 剩余 9 个 action，让 user.ts 整体覆盖率达到 80/70/85/80 阈值并启用门槛。沿用 Sprint 1 + Sprint 2.1 已验证的所有范式（vi.hoisted + mockNuxtImport + 模块隔离）。

**前置文档**：

- `.claude/test-framework/PLAN.md` §6.2、§7、§8 P1 第 4 项
- `.claude/test-framework/phase2/sprint2.1-user-store-pure.md`（已完成 36 用例）
- 现有 spec：`apps/slax-reader-dweb/tests/unit/stores/user.spec.ts`（374 行，36 用例）

**强制纪律**（继承 sprint 1 + 2.1）：

1. 写 spec 前必须 Read 被测源码
2. 不用 `as any` / `@ts-ignore` / 过松断言
3. commit message 英文
4. 沿用同一个 spec 文件 `tests/unit/stores/user.spec.ts`，不新建文件

---

## 1. 被测面分析

### 1.1 调 request 的 action（4 个）

| Action | 行号 | 行为 | request 调用 |
| --- | --- | --- | --- |
| `refreshUserInfo` | 91-105 | GET `/v1/user/me`；resp 为空抛 'refresh user info failed'；resp.lang 与当前 locale 不同时调 `this.changeLocalLocale(resp.lang)` | `request().get<UserInfo>({ url: ME })` |
| `getUserInfo` | 106-116 | options.refresh=true 且 isLogin → 先调 refreshUserInfo；this.user 为空抛 'get user info failed'；返回 this.user | （间接） |
| `refreshUserToken` | 145-157 | POST `/v1/user/refresh` 拿 token；resp 为空 return（不抛错）；resp.token 写 cookie（含 60 天 expires + COOKIE_DOMAIN） | `request().post<{ token }>({ url: TOKEN_REFRESH })` |
| `changeUserSetting` | 136-144 | POST `/v1/user/setting` body { key, value } | `request().post({ url: USER_INFO_SETTING, body: ... })` |

### 1.2 复合 action（3 个）

| Action | 行号 | 行为 |
| --- | --- | --- |
| `changeLocale` | 129-135 | 当前 locale 与新 locale 相同 → 早退；否则调 `changeUserSetting('lang', locale).then(() => { refreshUserToken(); changeLocalLocale(locale) })` |
| `checkAndRefreshUserToken` | 170-184 | 距 lastRefreshTokenDate < 24h → 早退；token cookie 不存在 → 早退；否则更新 lastRefreshTokenDate=now + 调 refreshUserToken |
| `changeLocalLocale` | 120-128 | locale 不在 ['en', 'zh'] 白名单 → fallback 'en'；this.locale = locale；调 `useNuxtApp().$i18n.setLocale(locale)` |

### 1.3 与 sprint 2.1 的 mock 链路差异

Sprint 2.1 仅 mock `useI18n` + `haveRequestToken`。Sprint 2.2 需新增：

- **`request`**（4 个 action 调）—— Nuxt auto-import，复用 Sprint 1 useAuth.spec.ts 同款 vi.hoisted + mockNuxtImport 模式
- **`useCookies`**（refreshUserToken 写 cookie + checkAndRefreshUserToken 读 cookie）—— 显式 import 路径 `@vueuse/integrations/useCookies`，用 `vi.mock` 拦
- **`useRuntimeConfig`**（refreshUserToken 读 COOKIE_TOKEN_NAME / COOKIE_DOMAIN）—— Nuxt auto-import，mockNuxtImport
- **`useNuxtApp`**（changeLocalLocale 调 $i18n.setLocale）—— Nuxt auto-import，mockNuxtImport

---

## 2. 测试切分

在现有 `tests/unit/stores/user.spec.ts` 末尾追加 3 个 describe 块。

### 2.1 `describe('useUserStore - request 类 actions')`（10 用例）

#### `refreshUserInfo`（4 用例）

- it 'request().get 成功 → 写入 store.user 并返回 user'
- it '后端返回空 → 抛 "refresh user info failed"'
- it 'resp.lang 与当前 locale 不同 → 调 changeLocalLocale 同步'
- it 'resp.lang 与当前 locale 相同 → 不调 changeLocalLocale'

#### `getUserInfo`（3 用例）

- it 'options.refresh=true + isLogin=true → 先调 refreshUserInfo + 返回更新后的 user'
- it 'this.user 已存在 + 不带 refresh → 直接返回 user，不调 refreshUserInfo'
- it 'this.user 为空 + 没有 refresh → 抛 "get user info failed"'

#### `refreshUserToken`（2 用例）

- it 'request().post 成功 → cookies.set 写入 token（含 60 天 expires + COOKIE_DOMAIN）'
- it '后端返回 falsy → return 不写 cookie 不抛错'

#### `changeUserSetting`（1 用例）

- it '调用 request().post 用正确 url + body'

### 2.2 `describe('useUserStore - 复合 actions')`（5 用例）

#### `changeLocale`（2 用例）

- it 'locale 与当前相同 → 早退（不调 request）'
- it 'locale 不同 → 调 changeUserSetting，then refreshUserToken + changeLocalLocale'

#### `checkAndRefreshUserToken`（3 用例）

- it '距 lastRefreshTokenDate < 24h → 早退（不调 cookies.get / refreshUserToken）'
- it '距 > 24h 但 token cookie 不存在 → 早退（不调 refreshUserToken）'
- it '距 > 24h + token 存在 → 更新 lastRefreshTokenDate + 调 refreshUserToken'

### 2.3 `describe('useUserStore - changeLocalLocale')`（3 用例）

- it 'locale 在白名单 ["en", "zh"] → 调 i18n.setLocale 用原值'
- it 'locale 不在白名单（如 "fr"）→ fallback "en"，调 i18n.setLocale("en")'
- it 'this.locale 同步赋值（与 i18n.setLocale 调用一致）'

合计：10 + 5 + 3 = **18 用例**。

---

## 3. mock 链路

在现有 spec 顶层 vi.hoisted 块**新增** mock 句柄；现有 mocks 不动。

### 3.1 新增 vi.hoisted

```ts
// 顶层 vi.hoisted 扩展（与 Task 1 已写的 haveRequestTokenMock + useI18nMock 合并到同一 vi.hoisted）
const {
  haveRequestTokenMock, // sprint 2.1 已有
  useI18nMock, // sprint 2.1 已有
  // sprint 2.2 新增：
  mockGet,
  mockPost,
  mockRequest,
  cookieGet,
  cookieSet,
  cookieRemove
  // ❌ setLocaleMock 已移除（参考 §3.2 重大约束）—— useNuxtApp 不能 mock，
  // changeLocalLocale 用例改用 vi.spyOn(useNuxtApp().$i18n, 'setLocale') 局部 spy
} = vi.hoisted(() => {
  const post = vi.fn()
  const get = vi.fn()
  return {
    haveRequestTokenMock: vi.fn(() => false),
    useI18nMock: vi.fn(() => ({ locale: { value: 'en' } })),
    mockGet: get,
    mockPost: post,
    mockRequest: vi.fn(() => ({
      get,
      post,
      put: vi.fn(),
      delete: vi.fn(),
      stream: vi.fn(),
      upgrade: vi.fn(),
      uploadFile: vi.fn()
    })),
    cookieGet: vi.fn(),
    cookieSet: vi.fn(),
    cookieRemove: vi.fn()
  }
})
```

### 3.2 mock 注册（**Task 1 施工期发现重大约束**）

```ts
// sprint 2.1 已有
mockNuxtImport('haveRequestToken', () => haveRequestTokenMock)
mockNuxtImport('useI18n', () => useI18nMock)

// sprint 2.2 新增
mockNuxtImport('request', () => mockRequest)

const runtimeConfig = {
  app: { baseURL: '/' },
  public: {
    COOKIE_TOKEN_NAME: 'token',
    COOKIE_DOMAIN: '.example.com'
  }
}
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)

// ❌ 禁用：mockNuxtImport('useNuxtApp', () => () => ({ $i18n: { setLocale: setLocaleMock } }))
//
// 施工期发现：替换 useNuxtApp 会破坏 setupNuxt 初始化——
// nuxt-test-utils 内部的 pinia payload-plugin 在 init 期读 `nuxtApp.skipHydrate`，
// 被替换后报 "Cannot set properties of undefined (setting 'skipHydrate')"，
# 整个 spec 文件 suite fail / 全部 skip。
//
// ✅ 替代方案：在用例内对 store action 直接 spy：
//   const spy = vi.spyOn(store, 'changeLocalLocale').mockResolvedValue()
//   await store.refreshUserInfo()
//   expect(spy).toHaveBeenCalledWith('zh')
//
// 适用范围：
//   - refreshUserInfo（调内部 changeLocalLocale）→ spy on changeLocalLocale
//   - changeLocalLocale 本身（调 useNuxtApp().$i18n.setLocale）→ 用例内
//     `const i18nApp = useNuxtApp(); vi.spyOn(i18nApp.$i18n, 'setLocale')`
//     拿到真实 nuxtApp 实例后局部 spy，**不要替换整个 useNuxtApp**

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({ set: cookieSet, get: cookieGet, remove: cookieRemove })
}))
```

> **setLocaleMock 已从 §3.1 vi.hoisted 块中移除**——不再需要顶层 spy 句柄。

### 3.3 sprint 2.2 新增 describe 块各自 beforeEach

```ts
describe('useUserStore - request 类 actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    haveRequestTokenMock.mockReset().mockReturnValue(false)
    mockGet.mockReset()
    mockPost.mockReset()
    mockRequest.mockClear()
    cookieGet.mockReset().mockReturnValue(undefined)
    cookieSet.mockClear()
    // setLocaleMock 已移除——sprint 2.2 不再顶层 spy useNuxtApp().$i18n.setLocale；
    // refreshUserInfo 用例用 vi.spyOn(store, 'changeLocalLocale')；
    // changeLocalLocale 自身用例用 vi.spyOn(useNuxtApp().$i18n, 'setLocale') 局部 spy
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ... 10 用例
})
```

复合 + changeLocalLocale 块同款 beforeEach（重复但不耦合）。

---

## 4. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `refreshUserInfo` 内部调 `this.changeLocalLocale(resp.lang)`，**不能**靠 mock useNuxtApp 拦 setLocale | 中 | 用例改用 `vi.spyOn(store, 'changeLocalLocale').mockResolvedValue()` 直接 spy 在 store action 上，断言 spy 是否被调及参数；这覆盖了相同的行为契约（refreshUserInfo 是否分发 locale 同步），且不破坏 setupNuxt |
| `changeLocale` 复合：`changeUserSetting().then(() => { refreshUserToken(); changeLocalLocale() })` —— refreshUserToken 也是 fire-and-forget `.then`（user.ts:145，**没有** await）。注意 beforeEach 启用了 `vi.useFakeTimers()`，**禁止用 `setTimeout(0)` flush**（fake timer 不会自动推进，await 会挂死）—— 改用 `await Promise.resolve()` flush microtask，嵌套 `.then` 写多次 `await Promise.resolve()` 直至所有 then 链 settle。**特别注意 mockPost 双调用**：changeUserSetting 和 refreshUserToken 都调 mockPost，beforeEach `mockPost.mockReset()` 后默认返回 undefined，`undefined.then(...)` 会异步抛错。changeLocale 成功用例必须**预置两次** mockPost 返回值：`mockPost.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ token: 'tk' })` | 高 | 用例写法：`mockPost.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ token: 'tk' }); await store.changeLocale('zh'); await Promise.resolve(); await Promise.resolve()`（第一次 flush changeUserSetting 的 then；第二次 flush refreshUserToken 内部的 then 链）。断言三件事：第一个 mockPost 调用 USER_INFO_SETTING（changeUserSetting）+ 第二个 mockPost 调用 TOKEN_REFRESH（refreshUserToken）+ store.changeLocalLocale 被调（**用 `vi.spyOn(store, 'changeLocalLocale')` 拦截**，不要尝试断言 setLocale，原因见 §3.2） |
| **refreshUserToken 单独测时也是 fire-and-forget**（user.ts:146-156）—— action 本身被声明 `async refreshUserToken()` 返 `Promise<void>`，但内部 `request().post(...).then(...)` 没 return；spec **可以 `await store.refreshUserToken()`**（不会挂），但 await 仅等 action 同步部分完成，**不代表内部 `.then` 副作用已发生**，仍需 microtask flush 才能断言 cookieSet | 高 | 用例写法：`mockPost.mockResolvedValueOnce({ token: 'tk' }); await store.refreshUserToken(); await Promise.resolve(); await Promise.resolve();` 再断言 cookieSet。空返回用例同款 flush，断言 cookieSet **没**被调用 |
| **checkAndRefreshUserToken 触发 refreshUserToken 时也要预置 mockPost** —— "距 > 24h + token 存在 → 调 refreshUserToken" 用例必须 `mockPost.mockResolvedValueOnce({ token: 'tk' })`，否则 fire-and-forget 链路 `undefined.then` 异步抛错 | 高 | 用例预置 mockPost 后 `store.checkAndRefreshUserToken(); await Promise.resolve(); await Promise.resolve();` flush，再断言 lastRefreshTokenDate 已更新 + cookieSet 被调（来自内部 refreshUserToken 链） |
| `checkAndRefreshUserToken` 用 `useCookies()` 直接拿 `get('token')`（不是配置里的 COOKIE_TOKEN_NAME）—— 写死字符串 'token' 是源码 line 177 实际行为 | 低 | 用例用 'token' 字符串 |
| `refreshUserToken` 内部 `set` 含 `expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)` —— vi.useFakeTimers 锁 now 后断言 expires 精确值 | 低 | `expect(cookieSet).toHaveBeenCalledWith('token', 'tk', expect.objectContaining({ path: '/', domain: '.example.com', expires: new Date(Date.now() + 60*24*60*60*1000) }))` |
| changeLocalLocale 用例：源码先 `this.locale = locale` 再 `useNuxtApp().$i18n.setLocale(...)` —— this.locale 已是被白名单过滤后的值 | 低 | 用例内 `const i18nApp = useNuxtApp(); const setLocaleSpy = vi.spyOn(i18nApp.$i18n, 'setLocale')`；调 store.changeLocalLocale 后断言 `store.locale === 'en'` + `setLocaleSpy.toHaveBeenCalledWith('en')` |
| sprint 2.1 已写的 36 用例不能因新增 mock 而破坏 | 中 | 新增 mock 只在新 describe 块的 beforeEach 用 / mockReset。sprint 2.1 已写 beforeEach 不动，但运行时所有 mock 依然存在——影响 sprint 2.1 用例的可能性低，跑全量验证一次即可 |

---

## 5. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts`，新增：

```ts
'layers/core/app/stores/user.ts': {
  lines: 80,
  branches: 70,
  functions: 85,
  statements: 80
}
```

预期实测覆盖率：lines 90+ / branches 80+ / functions 100 / statements 90+。

---

## 6. Sprint 2.2 任务拆分（2 个 task 串行）

### Task 1：扩展 mock 链路 + request 类 actions（10 用例）

修改 `tests/unit/stores/user.spec.ts`：

1. 顶层 `vi.hoisted` 扩展（追加 mockGet/mockPost/mockRequest/cookieGet/cookieSet/cookieRemove 的句柄声明，与 sprint 2.1 同一 hoisted 块合并；**不**追加 setLocaleMock，原因见 §3.2）
2. 顶层追加 3 个 mockNuxtImport（request / useRuntimeConfig / useNuxtApp）+ 1 个 vi.mock（@vueuse/integrations/useCookies，显式 import 路径）
3. 末尾追加 `describe('useUserStore - request 类 actions')` 含 10 用例

commit：`test(dweb): cover user store request-driven actions (sprint 2.2.1)`

### Task 2：复合 actions + changeLocalLocale（8 用例）+ 启用阈值

继续 spec 末尾追加 `describe('useUserStore - 复合 actions')` 5 用例 + `describe('useUserStore - changeLocalLocale')` 3 用例 = 8 用例。

跑 coverage 实测 user.ts → 改 vitest.config 启用单文件阈值 → 跑全量验收。

commit：`test(dweb): cover user store composite actions + locale fallback, enable threshold (sprint 2.2.2)`

---

## 7. 验收清单

- [ ] 18 用例（Task 1: 10 + Task 2: 8）全过
- [ ] 全量 108 → 126 用例通过，0 todo / 0 fail
- [ ] vitest.config.ts 启用 stores/user.ts 阈值 80/70/85/80
- [ ] `pnpm test:coverage` 退出码 0
- [ ] sprint 2.1 已写的 36 用例无回归
- [ ] PLAN.md §7 渐进策略表追加 sprint 2.2 行
- [ ] commit 全英文，分 2 commits

## 8. Self-Review

1. ✓ 沿用 sprint 1 useAuth.spec.ts 验证过的 mockNuxtImport + vi.hoisted 模式（request / useNuxtApp / useCookies 等）
2. ✓ vi.useFakeTimers 锁 expires / lastRefreshTokenDate 精确值
3. ✓ 复合 action 用例 await microtask flush 兜住 .then 异步副作用
4. ✓ 不在 sprint 2.1 已写代码内改动；新增 mock 影响 sprint 2.1 用例的风险已评估并加全量回归断言
5. ✓ checkAndRefreshUserToken 用例锁住源码硬编码字符串 'token'（line 177），不要改成 COOKIE_TOKEN_NAME
6. ✓ 实施前 grep 确认 RESTMethodPath.ME / TOKEN_REFRESH / USER_INFO_SETTING 真实路径（已确认 `/v1/user/me` / `/v1/user/refresh` / `/v1/user/setting`）
