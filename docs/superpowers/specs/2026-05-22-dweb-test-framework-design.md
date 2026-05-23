# slax-reader-dweb 测试框架施工方案

> 生成时间：2026-05-22适用范围：`apps/slax-reader-dweb` 不在范围：端到端（e2e）测试、`apps/slax-reader-extensions`

---

## 1. 背景与目标

### 1.1 现状

- 测试栈已具备：`vitest@4` + `@nuxt/test-utils@4` + `@vue/test-utils@2` + `@testing-library/vue@8` + `happy-dom@20`
- 现有用例 6 个：
  - `tests/app.nuxt.spec.ts`（被 `it.skip` 跳过的登录页占位）
  - `tests/components/BookmarkPanel.spec.ts`（仅校验按钮数量，覆盖薄）
  - `tests/theme/tokens.spec.ts`、`useIframeTheme.spec.ts`、`useIframeStyle.spec.ts`、`ThemeSwitcher.spec.ts`（质量较好，theme 任务沉淀）
- 被测体量：layers/core/app 下 ≈ 78 Vue 组件 + ≈ 58 ts 模块 + 多页面/composable/store
- graphify 标识的 god nodes：`request()`、`NotificationWorker`、`ChatBot`、`DwebBookmarkProvider`、`DwebEnvironmentAdapter`、`modalBootloader()`

### 1.2 目标

为 dweb 建立可持续运维的测试体系，覆盖**单元 + 组件交互 + 页面集成**三层，外部依赖一律 mock，分层引入 v8 coverage 门槛保证回归不被遗漏，且在第一期只交付**脚手架 + 5 类样板用例各 1 例**，验收通过后再进入第二期补全高优先模块。

### 1.3 非目标

- 不引入 Playwright/Cypress 等真实浏览器 e2e（用户明确暂缓）
- 不为 `apps/slax-reader-extensions` 设计测试框架
- 不重写已有 theme 系列 4 个 spec（质量已达标，原位保留）
- 不引入 MSW（用户已选"全部 mock 边界"路线）

---

## 2. 关键决策（已确认）

| 决策点            | 选择                                    | 理由                                                           |
| ----------------- | --------------------------------------- | -------------------------------------------------------------- |
| 覆盖路线          | **风险驱动分层覆盖**                    | 投入产出最高，1–2 周可见效                                     |
| 测试类型          | **单元 + 组件交互 + 页面集成** 三层     | 跳过 e2e，但 integration 层用 `renderSuspended` 验证多组件协同 |
| 外部依赖隔离      | **全部 mock 边界**                      | 测试快、稳定、跨机一致                                         |
| 覆盖率工具        | **v8 coverage + 分层门槛**              | 三层差异化设阈值，渐进抬升                                     |
| 实施节奏          | **第一期脚手架+样板，第二期高优先模块** | 验收节点清晰，PR 可拆分                                        |
| 目录组织          | **方案 A：扁平 `tests/` 镜像源码**      | 与 `vitest.config.ts` 兼容，迁移成本最低                       |
| fixtures vs mocks | **保持分目录**                          | 假数据 vs 假行为职责不同，强制分类减心智负担                   |
| 集成层命名        | **`tests/integration/`**（不叫 pages）  | 与未来 e2e 不冲突，对齐金字塔标准术语                          |
| coverage 全局门槛 | **第一期注释保留，仅启用三层局部门槛**  | 现状若直接全局 60% 会全红，渐进抬升                            |
| matchers 扩展     | **第一期不做**                          | 等真出现重复断言再抽                                           |

---

## 3. 目录结构

```
apps/slax-reader-dweb/tests/
├── README.md                          # 测试约定 + 写作指南（含示例链接）
├── setup/
│   ├── index.ts                       # vitest setupFiles 总入口
│   ├── globalMocks.ts                 # 全测试一律 mock 的边界（firebase / workbox）
│   ├── i18n.ts                        # createTestI18n() 工厂
│   ├── pinia.ts                       # createTestPinia() 工厂
│   └── mount.ts                       # mountWithApp() 工厂
├── fixtures/                          # 假数据
│   ├── bookmark.ts
│   ├── article.ts
│   ├── chat.ts
│   ├── user.ts
│   ├── notification.ts
│   └── theme.ts
├── mocks/                             # 假行为
│   ├── request.ts                     # 拦截 layers/core/app/utils/request.ts
│   ├── firebase.ts                    # 补足 globalMocks 之外的细粒度 firebase API
│   ├── pwa.ts
│   ├── channel.ts
│   ├── env.ts                         # mock DwebEnvironmentAdapter
│   └── analytics.ts
├── unit/                              # 单元测试，路径镜像 layers/core/app
│   ├── utils/
│   │   ├── string.spec.ts             # ★ 第一期样板（utils 纯函数）
│   │   ├── request.spec.ts            # ★ 第一期样板（边界 mock）
│   │   └── ...                        # 第二期补全
│   ├── composables/
│   │   ├── useAuth.spec.ts            # ★ 第一期样板（composable）
│   │   └── ...                        # 第二期补全
│   └── stores/
│       └── user.spec.ts               # 第二期
├── components/                        # 组件交互测试（已存在，保留并扩写）
│   ├── BookmarkPanel.spec.ts          # ★ 第一期样板（行为驱动重写）
│   └── ...                            # 第二期按 god node 排序补全
├── integration/                       # 页面集成测试（renderSuspended）
│   └── app.spec.ts                    # ★ 第一期样板（由 tests/app.nuxt.spec.ts 迁入并启用）
└── theme/                             # 已有，原位保留
    ├── tokens.spec.ts
    ├── useIframeTheme.spec.ts
    ├── useIframeStyle.spec.ts
    └── ThemeSwitcher.spec.ts
```

**命名约定**：

- 文件一律 `*.spec.ts`
- 一个被测单元一个 spec 文件，路径与源码相对路径完全镜像
- `describe` 用中文短句描述被测对象（沿用 theme 系列风格）
- `it` 描述行为而非"渲染数量"（重写 `BookmarkPanel.spec.ts` 时遵守）

---

## 4. vitest.config.ts 变更

### 4.1 现状

```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: './tests',
    include: ['**/*.spec.ts'],
    environment: 'nuxt',
    testTimeout: 10000,
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        mock: { intersectionObserver: true, indexedDb: true }
      }
    }
  }
})
```

### 4.2 目标

```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: './tests',
    include: ['**/*.spec.ts'],
    setupFiles: ['./tests/setup/index.ts'],
    environment: 'nuxt',
    testTimeout: 10000,
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        mock: { intersectionObserver: true, indexedDb: true }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [
        'layers/core/app/**/*.d.ts',
        'layers/core/app/**/types.ts',
        'layers/core/app/app.vue',
        'layers/core/app/error.vue',
        'layers/core/app/layouts/**',
        'layers/core/app/plugins/**'
        // 注意：layers/core/app/pages/** 不排除——页面承载主要业务逻辑（多个文件 400+ 行），
        // 必须纳入覆盖率分母。但第一/二期不为 pages 设局部门槛，仅观测，
        // 由 tests/integration/ 下的页面集成测试逐步推高覆盖率。
      ],
      thresholds: {
        // 全局门槛第一期注释保留，等核心模块完成后再启用
        // lines: 70, branches: 65, functions: 70, statements: 70,

        // 第一期：只对已写样板的具体文件设阈值，避免未测试的同目录文件按 0% 拖垮均值
        'layers/core/app/utils/string.ts': {
          lines: 90,
          branches: 85,
          functions: 90,
          statements: 90
        },
        'layers/core/app/composables/useAuth.ts': {
          lines: 80,
          branches: 70,
          functions: 90,
          statements: 80
        }

        // request.ts 第一期不设阈值——样板只测 getUserToken / haveRequestToken，
        // 而源码里 ServerRequest 类 + request() 单例的拦截器分支占大头，
        // 不测就一定过不了 50% lines。等第二期补完 request() 的 interceptor / 401 / error
        // 分支后再启用：
        // 'layers/core/app/utils/request.ts': { lines: 80, branches: 70, functions: 85, statements: 80 },

        // 第二期目录级阈值（等高优先模块全部覆盖完成后再启用，挪到此处）：
        // 'layers/core/app/utils/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
        // 'layers/core/app/composables/**': { lines: 85, branches: 80, functions: 85, statements: 85 },
        // 'layers/core/app/stores/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
      }
    }
  }
})
```

### 4.3 package.json scripts 变更

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

> `vitest` 不带参数会进 watch 模式，CI/hooks 会卡住，正式 `test` 必须用 `vitest run`。

### 4.4 devDependencies 增量

启用 v8 coverage 必须额外安装 provider 包，否则 `test:coverage` 会报 `Cannot find dependency '@vitest/coverage-v8'`：

```bash
pnpm --F @apps/slax-reader-dweb add -D @vitest/coverage-v8@^4.1.7
```

版本约束：与现有 `vitest@^4.1.7` 对齐（v8 provider 与 vitest 主版本必须一致；命令里直接写死语义化版本号，避免 npm latest 漂移）。

---

## 5. 公共基础设施

### 5.1 setup 三件套

**`tests/setup/index.ts`**（vitest 自动加载）：

```ts
import { beforeEach } from 'vitest'
import './globalMocks'

beforeEach(() => {
  document.body.innerHTML = ''
})
```

**`tests/setup/globalMocks.ts`**：

```ts
import { vi } from 'vitest'

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(), getApps: () => [] }))
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  onMessage: vi.fn(),
  getToken: vi.fn()
}))
vi.mock('workbox-precaching', () => ({ precacheAndRoute: vi.fn() }))
vi.mock('workbox-routing', () => ({ registerRoute: vi.fn() }))
vi.mock('workbox-strategies', () => ({ NetworkFirst: vi.fn(), CacheFirst: vi.fn() }))
vi.mock('workbox-cacheable-response', () => ({ CacheableResponsePlugin: vi.fn() }))
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: vi.fn() }))
```

**`tests/setup/i18n.ts`**：

```ts
import { createI18n } from 'vue-i18n'
import { getI18nLang } from '~~/layers/core/i18n/config'

// 项目 i18n 仅配置 en / zh 两个 locale（layers/core/i18n/config.ts）
// 不要写 zh-CN，否则 vue-i18n 找不到 messages 会退回到 key 文本
export const createTestI18n = (locale: 'en' | 'zh' = 'en') => createI18n({ legacy: false, locale, messages: getI18nLang() })
```

**`tests/setup/pinia.ts`**：

```ts
import { createPinia, setActivePinia } from 'pinia'

export const createTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
```

**`tests/setup/mount.ts`**：

```ts
import { mount, type MountingOptions } from '@vue/test-utils'
import { createTestI18n } from './i18n'
import { createTestPinia } from './pinia'

// 注意 global 合并顺序：先展开调用方传入的 options.global，再用合并后的 plugins 覆盖。
// 反过来写（先写 plugins，后展开 ...options.global）会让调用方的 plugins 字段
// 整个覆盖默认的 i18n + pinia，导致组件里 $t / store 注入失败。
export const mountWithApp = <T>(component: T, options: MountingOptions<any> = {}) =>
  mount(component as any, {
    ...options,
    global: {
      ...options.global,
      plugins: [createTestI18n(), createTestPinia(), ...(options.global?.plugins ?? [])]
    }
  })
```

### 5.2 fixtures 设计模式

每个 fixture 文件导出三档：

1. **基础对象**（完整字段、中性值）：`baseBookmark`
2. **变体工厂**（接受 overrides，返回派生）：`makeBookmark(overrides)`
3. **常用变体命名导出**：`archivedBookmark`, `taggedBookmark`

第一期需要落盘的 fixture 文件：

| 文件 | 必要性 | 第一期是否使用 |
| --- | --- | --- |
| `bookmark.ts` | 高 | **推迟到第二期** —— 第一期 5 个样板均不消费 bookmark 数据；commons/types 没有泛类 `Bookmark`，实际有 6 个具体接口（BookmarkItem/BookmarkBriefDetail/BookmarkDetail 等），第二期补 useBookmark/DwebBookmarkProvider 测试时才能明确选哪个 |
| `article.ts` | 高 | 第二期 |
| `chat.ts` | 中 | 第二期 |
| `user.ts` | 高 | ✓（useAuth 样板使用） |
| `notification.ts` | 中 | 第二期 |
| `theme.ts` | 低 | 第二期（theme 系列已有自己的常量） |

> 第一期只**实际写出** `user.ts`，其它文件留待第二期补，避免提前编造未验证的字段结构。bookmark.ts 推迟决策记录在 §14 第七轮修订。

### 5.3 mocks 设计模式

每个 mock 文件**只拦截一个边界**，导出 mock 函数本身让 spec 自控返回值。

```ts
// tests/mocks/request.ts
import { vi } from 'vitest'

// request() 是工厂函数，返回 FetchRequest 实例（含 get/post/put/delete 等链式方法）。
// useAuth.grantAuth 等业务代码写法是 request().post(...)，
// 直接 mockRequest = vi.fn() 默认返回 undefined → 链上 .post 必报
// "Cannot read properties of undefined (reading 'post')"。
// 因此 mock 文件级别就把 .post 等链式方法挂好，spec 只需 mockResolvedValue 调返回值。
// 方法名以 commons/utils/src/request.ts 的 FetchRequest 为准：
//   - 标准动词：get / post / put / delete（注意是 delete，不是 del）
//   - 流式与文件：stream / upgrade / uploadFile
// 第二期补 ChatBot / 上传链路时可能用到 stream 与 uploadFile，提前挂位避免测试拿不到方法。
export const mockPost = vi.fn()
export const mockGet = vi.fn()
export const mockPut = vi.fn()
export const mockDelete = vi.fn()
export const mockStream = vi.fn()
export const mockUpgrade = vi.fn()
export const mockUploadFile = vi.fn()

export const mockRequest = vi.fn(() => ({
  post: mockPost,
  get: mockGet,
  put: mockPut,
  delete: mockDelete,
  stream: mockStream,
  upgrade: mockUpgrade,
  uploadFile: mockUploadFile
}))

export const mockGetUserToken = vi.fn(() => 'test-token')
export const mockHaveRequestToken = vi.fn(() => true)

vi.mock('~~/layers/core/app/utils/request', () => ({
  request: mockRequest,
  getUserToken: mockGetUserToken,
  haveRequestToken: mockHaveRequestToken
}))
```

> spec 内典型用法：`mockPost.mockResolvedValueOnce({ token: 'abc' })` → useAuth.grantAuth 收到 token。每个 spec 在 `beforeEach` 里 `mockPost.mockReset()` / `mockRequest.mockClear()` 防止串扰。

第一期落盘的 mock 文件：

| 文件           | 必要性         | 第一期是否使用                             |
| -------------- | -------------- | ------------------------------------------ |
| `request.ts`   | 高（god node） | ✓                                          |
| `firebase.ts`  | 高             | globalMocks 已覆盖，单文件第二期再补细粒度 |
| `pwa.ts`       | 高             | globalMocks 已覆盖                         |
| `channel.ts`   | 中             | 第二期                                     |
| `env.ts`       | 中             | 第二期（god node 之一）                    |
| `analytics.ts` | 低             | 第二期                                     |

> 第一期只**实际写出** `request.ts`，其它在 README 留位。

---

## 6. 第一期样板用例清单（5 类各 1 例）

### 6.1 utils 纯函数样板：`tests/unit/utils/string.spec.ts`

被测：`layers/core/app/utils/string.ts` 的 `urlBase64ToUint8Array`

覆盖点：

- 标准 base64url 输入（含 `-` `_`）转换为 Uint8Array 字节正确
- 长度不是 4 倍数时 padding 补齐生效
- 空字符串边界
- 非法字符抛错（如果原函数不显式校验，则记录现状不强测）

### 6.2 utils 边界 mock 样板：`tests/unit/utils/request.spec.ts`

被测：`request.ts` 的 `getUserToken` / `haveRequestToken`（`request()` 单例本身覆盖太重，第二期再补）

覆盖点：

- 客户端走 `useCookies().get(name)` 路径
- 服务端走 `useRequestHeaders(['cookie'])` 路径
- token 不存在时 `haveRequestToken()` 返回 false

需要 mock：`@commons/utils/is` 的 `isClient/isServer`、`@vueuse/integrations/useCookies`、Nuxt 自动导入的 `useRequestHeaders/useRuntimeConfig`

### 6.3 composable 样板：`tests/unit/composables/useAuth.spec.ts`

被测：`layers/core/app/composables/useAuth.ts`

> 注：`useAuth` 是对象字面量包装的方法集（`requestAuth` / `requestAppleAuth` / `grantAuth` / `clearAuth`），**没有响应式状态**。覆盖点围绕"方法的副作用"展开，而非状态机。

覆盖点：

- `requestAuth(options)`：根据 platform 拼接 Google OAuth URL（含 client_id / redirect_uri / state JSON），最终写入 `location.href`
- `requestAppleAuth(options)`：同上，平台为 apple，URL 走 appleid.apple.com
- `grantAuth(code, redirectUri, affCode, 'google')`：调 `request().post(LOGIN, ...)` 成功 → `cookies.set(COOKIE_TOKEN_NAME, token, ...)` → 返回 token
- `grantAuth` 后端返回空 → 抛 `'login failed'`
- `clearAuth()`：调 `cookies.remove` 两次（带 domain / 不带 domain）+ 调 `userStore.clearUserInfo()` + try/catch 包住 `checkAndRemoveOriginalCookies`
- `checkAndRemoveOriginalCookies`：COOKIE_DOMAIN 段数 ≤ 2 时早退；段数 > 2 且存在旧 cookie 时按拼接后的父域名删除

需要 mock：

- `tests/mocks/request.ts`（拦 `request()`）
- `@vueuse/integrations/useCookies`（拦 set/get/remove）
- `~~/layers/core/app/stores/user`（拦 useUserStore，提供桩 clearUserInfo）
- Nuxt 注入的 `useRuntimeConfig`（提供 GOOGLE_OAUTH_CLIENT_ID / APPLE_OAUTH_CLIENT_ID / AUTH_BASE_URL / COOKIE_TOKEN_NAME / COOKIE_DOMAIN）
- `location.href`（happy-dom 下 `window.location` 已就绪，spec 内直接赋值并断言读回；不要用 `vi.stubGlobal` 替换整个 location 对象，会破坏 happy-dom 的 location 实现）

### 6.4 组件行为驱动样板：`tests/components/BookmarkPanel.spec.ts`（重写）

被测：`layers/core/app/components/BookmarkPanel.vue`

> 注：源码里 FEEDBACK 按钮只有 `<img>`，没有文本也没有 `aria-label`，按 `getByRole('button', { name: ... })` 查不到。本期样板**不给生产代码加 aria-label**（属于另一个无障碍议题，应单独走），改为按可定位特征分两类断言。

现状用例只校验 button 数量，第一期重写为行为驱动：

- **有文案的按钮（CHATBOT / AI / ARCHIVE / UNARCHIVE / TOP）**：按 `$t` key 渲染出对应 i18n 文案的 button，用 `getByRole('button', { name: '...' })` 定位
- **无文案的按钮（FEEDBACK）**：按 wrapper class `.feedback-wrapper` 内的 `button` 定位（容器选择器），断言渲染存在
- 点击各 type 对应的按钮，验证 emit `panelClick` 且 payload 等于该 BookmarkPanelType
- props.types 变化触发重新渲染（不含某 type → 不渲染对应 button）
- 边界：types = [] 时**不渲染任何 button / .item**（注意：普通 `.panel-wrapper` 容器本身无 `v-if`，是无条件渲染的；仅 `.panel-wrapper.pro` 和 `.feedback-wrapper` 会消失。断言粒度落到 button 数量为 0 + `.item` 数量为 0，不要断言"三个 wrapper 都不存在"）

### 6.5 页面集成样板：`tests/integration/app.spec.ts`（迁移自 `tests/app.nuxt.spec.ts`）

被测：`/` 路由下渲染的 homepage（`layers/core/app/components/Homepage.vue` + 子组件 `HomepageHero` / `HomepageCallToAction`）

> 注：旧 spec 里点击 Login 跳转的逻辑已不成立——`app.vue` 当前只是 `<NuxtLayout><NuxtPage /></NuxtLayout>` 壳，`/` 实际渲染的是 homepage，CTA 是 `Start Reading Smarter - Free`（HomepageHero）和 `Get Started - It's Free`（HomepageCallToAction），点击后调 `navigateTo('/bookmarks?from=homepage')`，没有任何 Login 按钮。旧 `it.skip` 中的 Login 流程**直接弃用**，覆盖点对齐 homepage 实际行为。

覆盖点：

- 进入 `/` 渲染 homepage 关键文案（`Start Reading Smarter - Free` / `Get Started - It's Free`）
- 点击 CTA 按钮触发 `navigateTo('/bookmarks?from=homepage')`（用 `mockNuxtImport` 拦 navigateTo 验证调用参数）
- 其它分支（如 i18n 切换 zh 后文案变化、未登录态 CTA 走向）实施时按源码实际行为补，不预设条数

需要 mock：

- `tests/mocks/request.ts`
- `navigateTo`：用 `@nuxt/test-utils/runtime` 提供的 `mockNuxtImport('navigateTo', ...)`。**不要**用 `vi.stubGlobal` 或裸 `vi.mock('#imports')` 替代——`navigateTo` 在 `Homepage.vue` 是 Nuxt auto-import，编译后已绑定到具体导入路径，stubGlobal 拦不到编译产物里的引用

> 旧 spec 里测 Login 流程的需求并未消失——后续可单独写一个 `tests/integration/login.spec.ts`，把 route 切到 `/login` 测登录页交互。

---

## 7. coverage 渐进策略

| 阶段 | 全局门槛 | 局部门槛 | pages 门槛 | 触发节点 |
| --- | --- | --- | --- | --- |
| 第一期（2026-05-23 达成） | 注释保留，不强制 | **仅对已落样板的 2 个具体文件**设单文件阈值（string.ts 90/85/90/90、useAuth.ts 80/70/90/80）；request.ts 第一期不设阈值 | 不设，仅观测 | 5 类样板用例落地后 |
| **第二期 sprint 1（2026-05-23 达成）** | 注释保留 | 在第一期基础上启用 request.ts 单文件阈值 80/70/85/80（实测 100/93.33/100/100） | 不设，仅观测 | request.ts 23 用例完整覆盖后 |
| **第二期 sprint 2（2026-05-23 达成）** | 注释保留 | 在 sprint 1 基础上启用 stores/user.ts 单文件阈值 80/70/85/80（实测 100/100/100/100） | 不设，仅观测 | user store 54 用例（36 sprint 2.1 纯逻辑 + 18 sprint 2.2 request 类/复合）覆盖后 |
| **第二期 sprint 3（2026-05-23 达成）** | 注释保留 | 在 sprint 2 基础上启用 utils/environment.ts 80/70/85/80（实测 100/94.44/100/100）+ DwebEnvironmentAdapter.ts 80/70/85/80（实测 100/100/100/100） | 不设，仅观测 | environment + adapter 19 用例覆盖后；首次用 codex review 4 轮自动审计 spec 文档 |
| 第二期目录级（待启用） | 70/65/70/70（启用） | 启用**目录级**：utils/** 90/85/90/90、composables/** 85/80/85/85、stores/** 90/85/90/90、components/** 70/65/70/70 | 不设，仅观测 | 高优先模块（见 §8）覆盖完成后 |
| 第三期 | 80/75/80/80 | utils 95/90/95/95、composables 90/85/90/90 | 60/55/60/60 起步 | 全模块 + 主要页面集成测试覆盖稳定后 |

> 阶段升级条件是"实测达标 5 个工作日内未回退"，不是日期。不卡死时间，避免为了过门槛刷无效用例。

---

## 8. 第二期高优先模块清单（按 graphify god node 排序）

| 优先级 | 模块 | 类型 | 主要难点 |
| --- | --- | --- | --- |
| P0 | `utils/request.ts` 完整 `request()` 单例 | unit | useRuntimeConfig + 拦截器组合 |
| P0 | `Notification/UserNotification.vue` + `NotificationWorker` | component + unit | 异步 messaging + 13 边连接 |
| P0 | `Chat/ChatBot` 链路 | component | 流式响应 + 8 边连接 |
| P0 | `composables/bookmark/useBookmark.ts` + `DwebBookmarkProvider` | unit + component | provider/inject 链 |
| P1 | `utils/environment.ts` + `DwebEnvironmentAdapter` | unit | 平台分支多 |
| P1 | `components/Modal/index.ts` + `modalBootloader` | unit | 7 边动态挂载 |
| P1 | `composables/useBookmarkRelative.ts` | unit | 跨 modal/feedback 编排 |
| P1 | `stores/user.ts` | unit | 鉴权状态机 |
| P2 | `Article/*` 渲染 | component | 复杂 DOM 流水线 |
| P2 | `Markdown/*` 渲染 | component | 富文本边界多 |
| P1 | `pages/bookmarks/index.vue`（748 行）+ `pages/bookmarks/[id].vue`（488 行）+ `pages/w/[id].vue`（475 行） | integration | 列表/筛选/分页、页面承载主要业务逻辑 |
| P2 | 其它中型页面（`pages/download.vue`、`pages/contact.vue`、`pages/sw/[id].vue`、`pages/s/[id].vue`、`pages/user.vue`） | integration | 单页交互闭环 |

第二期不一次性立项，按优先级单 PR 推进，每个模块完成后跑一次 coverage 看回归。

### 8.1 第二期 fixture / mock 数据来源（用户 2026-05-23 提供）

第二期补 fixture（bookmark / article / chat / notification 等）和 mock 返回值时，**优先从真实后端拉数据反向构造**，避免凭空编结构：

- **本地后端 baseUrl**：`http://localhost:8787`（开发期调试 URL）
- **后端工程位置**：`../slax-reader-api-community/`（与本仓库同级，路径 `/Users/yjc/Documents/Company/slax-reader-api-community`），可读其源码确认接口路径、参数、返回类型、ID 长度、枚举值
- **测试用 user token**（仅在受控本地环境使用，**不要写进 commit 或对外文档**；token 已在用户提供的指令里出现过，需要时回看会话历史，**不要在代码注释/fixture/日志里出现**）：调登录态接口时用 `Authorization: Bearer <token>` 头

工作流：

1. 写新 fixture 前先 `curl -H "Authorization: Bearer <token>" http://localhost:8787/<endpoint>` 抓一份真实 response
2. 把 response 的字段名/类型/可能枚举对照 `commons/types/src/interface.ts` 接口定义校准
3. fixture 用真实 ID 长度（如 bookmark_id 通常 19 位数字）、真实时间戳格式
4. 敏感数据（user_id、email 等）替换成 fixture 标准值（baseUser 已就绪），但形态保持真实
5. **绝不**把 token 字符串硬编码到 fixture / spec / 注释里——需要它的测试在本地用环境变量临时注入

> 后端只读：第二期阶段任何对 `slax-reader-api-community` 的 query 都是只读 `curl`。**不要**用 token 做 POST/PUT/DELETE 创建测试数据，避免污染本地后端状态。

---

## 9. 验证流程

### 9.1 本地三步验证（每个 PR 必跑）

1. `pnpm --F @apps/slax-reader-dweb test` — 全部用例通过
2. `pnpm --F @apps/slax-reader-dweb test:coverage` — 已启用的局部门槛达标（第一期：string.ts、useAuth.ts；request.ts 仅观测）
3. `pnpm dev:dweb` 冒烟 — 确认测试 mock 没改坏运行时（mock 只在 setup/spec 内生效，不应渗透到 dev server）

### 9.2 第一期验收点（2026-05-23 全部达成）

- [x] `tests/setup/` 五个文件就绪并 vitest 自动加载
- [x] `tests/fixtures/user.ts` 就绪（bookmark.ts 按 §14 第七轮推迟到第二期）
- [x] `tests/mocks/request.ts` 就绪（两套用法：显式 import 走 vi.mock 兜底；auto-import 由各 spec 自建 vi.hoisted + mockNuxtImport）
- [x] 5 类样板用例全部 `vitest run` 通过：string(5) / useAuth(8) / BookmarkPanel(12) / app.integration(2)
- [x] `pnpm test:coverage` 退出码 0：string.ts 100/100/100/100、useAuth.ts 100/100/100/100，均超过设定阈值
- [x] `tests/README.md` 写好测试指南（含 fixture/mock 用法 + auto-import 跨文件 spy 约束说明）
- [x] 全量 49 用例通过（含 theme 系列原有），`pnpm dev` 启动 mock 不污染运行时

### 9.3 第二期 sprint 1 验收点（2026-05-23 全部达成 — request.ts 完整覆盖）

- [x] 23 用例全过（4 客户端 getUserToken/haveRequestToken + 11 客户端 request() 工厂/拦截器 + 8 服务端 ServerRequest/getUserToken/errorInterceptor）
- [x] request.ts 覆盖率 100/93.33/100/100（lines/branches/functions/statements），远超阈值 80/70/85/80
- [x] vitest.config.ts 启用 request.ts 单文件阈值，`pnpm test:coverage` 退出码 0
- [x] 全量 49 → 72 用例（49 + 23）通过，0 todo / 0 fail
- [x] §7 渐进策略表 sprint 1 行回填
- [x] commit 全英文 message，分 4 commits（task 1.1/1.2/1.3 + sprint 1.4 done）
- [x] vi.doMock + vi.resetModules 模块隔离方案验证通过（**真切换 isServer**，无降级）

### 9.4 第二期 sprint 2 验收点（2026-05-23 全部达成 — stores/user.ts 完整覆盖）

- [x] 54 用例全过（sprint 2.1: 18 getter + 6 纯本地 action + 12 subscribe action = 36；sprint 2.2: 10 request 类 action + 5 复合 action + 3 changeLocalLocale = 18）
- [x] user.ts 覆盖率 100/100/100/100（lines/branches/functions/statements），全维度满分远超阈值 80/70/85/80
- [x] vitest.config.ts 启用 stores/user.ts 单文件阈值，`pnpm test:coverage` 退出码 0
- [x] 全量 72 → 126 用例（72 + 54）通过，0 todo / 0 fail
- [x] §7 渐进策略表 sprint 2 行回填
- [x] commit 全英文 message，分 4 commits（sprint 2.1.1/2.1.2 + sprint 2.2.1/2.2.2）
- [x] **新发现的架构约束**：`mockNuxtImport('useNuxtApp', ...)` 会破坏 setupNuxt 初始化（pinia payload-plugin 需要真 nuxtApp.skipHydrate），改用 `vi.spyOn(useNuxtApp().$i18n, 'setLocale')` 局部 spy 替代，已沉淀到 sprint 2.2 spec §3.2 + tests/README 后续可同步

### 9.5 第二期 sprint 3 验收点（2026-05-23 全部达成 — environment.ts + DwebEnvironmentAdapter.ts）

- [x] 19 用例全过（environment 13 + DwebEnvironmentAdapter 6）
- [x] environment.ts 覆盖率 100/94.44/100/100（branches 94.44 是 v8 把 `split[0] ?? ''` 的不可达 fallback 计入造成，超阈值 70）
- [x] DwebEnvironmentAdapter.ts 覆盖率 100/100/100/100
- [x] vitest.config.ts 启用两个单文件阈值，`pnpm test:coverage` 退出码 0
- [x] 全量 126 → 145 用例（126 + 19）通过，0 todo / 0 fail
- [x] sprint 1 + 2 共 77 用例（23 request + 54 user store）无回归
- [x] §7 渐进策略表 sprint 3 行回填
- [x] commit 全英文 message
- [x] **新增工具沉淀**：`.claude/test-framework/codex-review-loop.sh` + `.codex-review-loop.md` 文档，把 codex CLI 的 review 子命令做成多轮交互循环 helper。本 sprint 首次实战使用，4 轮 codex review 抓出 7 条意见全部成立、0 反驳后通过，验证 helper 可作为后续 sprint 的标准 spec 审查流程

### 9.6 失败处理

任一步失败：

1. 在 `.claude/test-framework/operations-log.md` 记录失败原因
2. 不绕过门槛、不删测试，找根因修
3. 同一类失败连续 3 次 → 暂停施工回退到设计阶段

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `@nuxt/test-utils` nuxt env 与 vi.mock 模块路径冲突 | 中 | 单元测试无法启动 | 先做样板验证；遇阻按 useIframeTheme.spec.ts 同款 import 路径写 |
| coverage v8 在 .vue 文件统计偏差 | 中 | 组件覆盖率虚低 | 第一期不对 components 设门槛，第二期看实测再定 |
| firebase/PWA 全局 mock 漏掉某子模块 | 中 | 测试启动报错 | globalMocks 留出扩展位，spec 报错时按需补 |
| Nuxt 自动导入（`useRuntimeConfig` / `navigateTo` / `useRequestHeaders` 等）测试环境缺失 | 高 | spec 报 ReferenceError | 一律在 spec 内用 `@nuxt/test-utils/runtime` 的 `mockNuxtImport(name, factory)` 拦截；不要用 `vi.stubGlobal`（拦不到编译产物里 auto-import 的绑定） |
| 重写 `BookmarkPanel.spec.ts` 引入 BookmarkPanelType 路径变化 | 低 | 现存用例失败 | 重写时先跑旧用例确认基线、再改 |

---

## 11. 第一期施工步骤（提供给后续 plan/implementation 阶段参考）

> 这一节是高层步骤，详细 plan 会在 superpowers 的 `writing-plans` 阶段产出。

1. 创建目录骨架与 `tests/README.md`
2. 写 `tests/setup/` 五件套 + 接入 `vitest.config.ts` 的 `setupFiles`
3. 写 `tests/fixtures/bookmark.ts` + `tests/fixtures/user.ts`
4. 写 `tests/mocks/request.ts`
5. 写 `tests/unit/utils/string.spec.ts`（最简，先验证 setup 通路）
6. 写 `tests/unit/utils/request.spec.ts`（验证 mock 通路）
7. 写 `tests/unit/composables/useAuth.spec.ts`（验证 composable 通路）
8. 重写 `tests/components/BookmarkPanel.spec.ts`（行为驱动）
9. 迁移 `tests/app.nuxt.spec.ts` → `tests/integration/app.spec.ts` 并启用 skip 用例
10. 接入 v8 coverage + 三层门槛
11. 修改 `package.json` scripts
12. 跑三步验证、修缺、提交

---

## 12. 不做清单（避免范围蔓延）

- ❌ Playwright/Cypress e2e
- ❌ MSW 真实 HTTP 拦截
- ❌ visual regression（Storybook、Chromatic）
- ❌ 性能基准（benchmark）
- ❌ mutation testing（Stryker）
- ❌ commons/types、commons/utils 包内测试（属于 mono repo 其它包，不在 dweb 范围）
- ❌ service-worker/、server/ 目录测试（与 nuxt env 冲突，需另起 node env，第三期再考虑）
- ❌ extensions 项目同步铺开（用户明确仅 dweb）

---

## 13. 文档去向

- 本方案：`.claude/test-framework/PLAN.md`（用户指定位置）
- superpowers 默认 spec 路径：`docs/superpowers/specs/2026-05-22-dweb-test-framework-design.md`（同步副本，供 brainstorming 流程合规）
- 后续实施 plan：`docs/superpowers/plans/...`（writing-plans 阶段产出）
- 操作日志：`.claude/test-framework/operations-log.md`（施工时按需创建）

---

## 14. 修订记录

### 2026-05-22 第一轮审计修订

- §4.4 新增 devDependencies 增量条目，要求安装 `@vitest/coverage-v8`（补 vitest 4 缺失的 v8 provider）
- §4.2 第一期 thresholds 从"按目录"改为"按已写样板的具体文件"，避免未测试同目录文件按 0% 拖垮均值；目录级阈值挪到第二期触发
- §5.1 `createTestI18n` 默认 locale 类型从 `'en' | 'zh-CN'` 改为 `'en' | 'zh'`，对齐 `layers/core/i18n/config.ts` 实际只导出的 en/zh
- §5.1 `mountWithApp` 修复 global 合并顺序：先展开 `options.global`，再用合并后的 plugins 覆盖；旧版会让调用方传入的 plugins 字段整个覆盖默认 i18n + pinia
- §6.3 useAuth 样板覆盖点重写：基于源码实际 API（`requestAuth` / `requestAppleAuth` / `grantAuth` / `clearAuth`）展开，不再假设响应式状态
- §7 渐进策略表"第一期"行同步：标注按文件设单文件阈值

### 2026-05-22 第二轮审计修订

- §4.2 移除 `request.ts` 的第一期阈值（50/40/60/50 仍过不了，因样板只测 2 个辅助函数、单例分支占大头）；改为第二期与 interceptor/401/error 分支补全同步启用 80/70/85/80
- §4.4 v8 provider 安装命令补版本号 `@vitest/coverage-v8@^4.1.7`，避免 npm latest 漂移到与 vitest 主版本不匹配的包
- §7 渐进策略表"第一期"列改为 2 个文件设阈值，并标注 request.ts 推迟到第二期；"第二期"列追加 request.ts 单文件 80/70/85/80
- §9.2 第一期验收清单改为"已设阈值的样板文件局部覆盖率"，移除 stores 字样（第一期没有 store 样板）

### 2026-05-22 第三轮审计修订

- §6.4 BookmarkPanel 样板：FEEDBACK 按钮源码无 aria-label/文本，`getByRole('button', { name })` 查不到。覆盖点改为"有文案按钮按 i18n 文案查、FEEDBACK 按 `.feedback-wrapper` 容器内的 button 查"，**不在本期改动生产代码加 aria-label**（无障碍议题单独走）
- §6.5 集成样板：旧 spec 里 Login 跳转流程已不成立——`app.vue` 当前是壳，`/` 渲染 homepage（CTA 是 `Start Reading Smarter - Free` / `Get Started - It's Free`），点击跳 `/bookmarks?from=homepage`。覆盖点重写对齐 homepage 实际行为；登录页测试拆出 `tests/integration/login.spec.ts` 后续单独做
- §9.1 验证流程第 2 步文案改为"已启用的局部门槛达标"，与 §9.2 验收点保持一致

### 2026-05-22 第四轮审计修订

- §6.4 BookmarkPanel 边界断言：源码里普通 `.panel-wrapper`（第 17 行）无 `v-if` 是无条件渲染的，仅 `.panel-wrapper.pro` 和 `.feedback-wrapper` 受 types 控制。types=[] 的边界断言改为"不渲染任何 button / .item"，避免断言"三个 wrapper 都不存在"导致测试假阳性失败

### 2026-05-22 第五轮审计修订

- §5.3 `tests/mocks/request.ts` 重写：`request()` 是工厂函数，业务代码用 `request().post(...)` 链式调用。`vi.fn()` 默认返回 undefined → `.post` 必报 `Cannot read properties of undefined`。mock 文件现在导出 `mockPost / mockGet / mockPut / mockDelete` 并让 `mockRequest` 默认返回挂好这些方法的对象，spec 用 `mockPost.mockResolvedValueOnce(...)` 直接控制返回值（注：本条最初按"行业惯用短名"误写为 `mockDel`，第六轮已统一对齐源码 `delete` 命名，本记录同步修正）
- §6.5 集成样板的 navigateTo mock 路径收敛到 `mockNuxtImport('navigateTo', ...)`，删掉 `vi.stubGlobal` 选项（auto-import 编译后已绑定到具体导入路径，stubGlobal 拦不到）
- 同类一致性扫描：§6.3 `location.href` 改为 happy-dom 下直接赋值断言（不用 stubGlobal 替换 location 对象）；§10 风险表里 Nuxt auto-import 的缓解措施统一到 `mockNuxtImport`

### 2026-05-22 第六轮审计修订

- §5.3 `tests/mocks/request.ts` 方法名对齐 `commons/utils/src/request.ts` 的 `FetchRequest`：`del` → `delete`（源码 76 行是 `async delete<T>`）
- 顺手补全 `FetchRequest` 上其它非标准方法的 mock 桩：`stream` / `upgrade` / `uploadFile`，避免第二期补 ChatBot 流式/上传链路时测试拿不到方法。注释里明确"以 FetchRequest 为准"，防止下次再凭直觉给方法起短名

### 2026-05-22 第七轮审计修订（施工期发现）

- §5.2 fixture 清单：`bookmark.ts` 推迟到第二期。施工开始后核对源码，commons/types/src/interface.ts **不存在泛类 `Bookmark`**，实际有 6 个具体接口（BookmarkItem / BookmarkBriefDetail / InlineBookmarkDetail / ShareBookmarkDetail / BookmarkDetail / BookmarkTag）。dweb 用得最多的是 BookmarkDetail（6 处）。本期 5 个样板里**没有任何一个消费 bookmark 数据**，按 YAGNI 原则推迟到第二期补 useBookmark / DwebBookmarkProvider 测试时再写，届时再决定 fixture 类型选 BookmarkDetail / BookmarkItem 还是别的
- 同时也对 PHASE1 plan 文档（`docs/superpowers/plans/2026-05-22-dweb-test-framework-phase1.md`）做了对齐：Task 4 范围从"bookmark + user"缩减为"仅 user"
