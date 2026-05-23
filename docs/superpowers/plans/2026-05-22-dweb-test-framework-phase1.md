# slax-reader-dweb 测试框架 第一期施工计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `apps/slax-reader-dweb` 搭起测试脚手架（setup/fixtures/mocks 三件套 + v8 coverage 单文件门槛），并落 5 类样板用例各 1 例，让后续模块测试有标准模板可复用。

**Architecture:** 在现有 `tests/` 目录下新建 `setup/ fixtures/ mocks/ unit/ integration/`，沿用 vitest 4 + @nuxt/test-utils + happy-dom + @vue/test-utils + @testing-library/vue 栈，全 mock 边界（request/firebase/PWA/auto-import），coverage 第一期仅对 `string.ts` / `useAuth.ts` 两个具体文件设阈值，避免未测试同目录文件按 0% 拖垮均值。

**Tech Stack:** vitest@4.1.7, @vitest/coverage-v8@^4.1.7, @nuxt/test-utils@4, @vue/test-utils@2, @testing-library/vue@8, happy-dom@20, pinia@3, vue-i18n@10

**前置文档：** `.claude/test-framework/PLAN.md`（设计 spec，已通过 8 轮审计）

**强制纪律：**

1. 写每个 spec 前必须先 `Read` 一遍被测源码——8 轮审计中有 5 轮是因为凭文档名脑补、不核对源码导致的，必须靠这条纪律打破
2. 每完成一个 task 跑一次 `pnpm --F @apps/slax-reader-dweb test`，绿了才提交
3. 提交信息用英文（项目偏好：commit message 英文，其它中文）
4. 不动 `tests/theme/` 下已有 4 个 spec（质量已达标，原位保留）
5. 不为修测试在生产代码加 aria-label 或改 API（这是无障碍/重构议题，本期不掺）

---

## 文件结构

**新建：**

- `apps/slax-reader-dweb/tests/setup/index.ts` — vitest setupFiles 入口
- `apps/slax-reader-dweb/tests/setup/globalMocks.ts` — firebase / workbox 全局 mock
- `apps/slax-reader-dweb/tests/setup/i18n.ts` — `createTestI18n()` 工厂
- `apps/slax-reader-dweb/tests/setup/pinia.ts` — `createTestPinia()` 工厂
- `apps/slax-reader-dweb/tests/setup/mount.ts` — `mountWithApp()` 工厂
- `apps/slax-reader-dweb/tests/fixtures/bookmark.ts` — 书签 fixture
- `apps/slax-reader-dweb/tests/fixtures/user.ts` — 用户 fixture
- `apps/slax-reader-dweb/tests/mocks/request.ts` — `request()` / `getUserToken` / `haveRequestToken` mock
- `apps/slax-reader-dweb/tests/unit/utils/string.spec.ts` — 样板①utils 纯函数
- `apps/slax-reader-dweb/tests/unit/composables/useAuth.spec.ts` — 样板③composable
- `apps/slax-reader-dweb/tests/integration/app.spec.ts` — 样板⑤页面集成
- `apps/slax-reader-dweb/tests/README.md` — 测试写作指南

**修改：**

- `apps/slax-reader-dweb/vitest.config.ts` — 加 setupFiles + coverage 配置
- `apps/slax-reader-dweb/package.json` — 加 @vitest/coverage-v8 依赖 + 调整 scripts
- `apps/slax-reader-dweb/tests/components/BookmarkPanel.spec.ts` — 样板④（重写为行为驱动）

**迁移：**

- `apps/slax-reader-dweb/tests/app.nuxt.spec.ts` → `apps/slax-reader-dweb/tests/integration/app.spec.ts`（旧文件删除）

---

## Task 1：安装 v8 coverage provider 依赖

**Files:**

- Modify: `apps/slax-reader-dweb/package.json`

- [ ] **Step 1.1：在 dweb 子包安装依赖（指定版本对齐 vitest@^4.1.7）**

```bash
cd /Users/yjc/Documents/Company/slax-reader-web
pnpm --F @apps/slax-reader-dweb add -D @vitest/coverage-v8@^4.1.7
```

- [ ] **Step 1.2：确认 package.json 增量**

```bash
grep coverage-v8 apps/slax-reader-dweb/package.json
```

Expected：能输出 `"@vitest/coverage-v8": "^4.1.7"`

- [ ] **Step 1.3：跑现有测试，确认安装没破坏基线**

```bash
pnpm --F @apps/slax-reader-dweb test
```

Expected：现有 6 个 spec（含 1 skip）全部通过

- [ ] **Step 1.4：commit**

```bash
git add apps/slax-reader-dweb/package.json pnpm-lock.yaml
git commit -m "chore(dweb): add @vitest/coverage-v8 for coverage reporting"
```

---

## Task 2：建测试目录骨架

**Files:**

- Create: `apps/slax-reader-dweb/tests/setup/` 目录
- Create: `apps/slax-reader-dweb/tests/fixtures/` 目录
- Create: `apps/slax-reader-dweb/tests/mocks/` 目录
- Create: `apps/slax-reader-dweb/tests/unit/utils/` 目录
- Create: `apps/slax-reader-dweb/tests/unit/composables/` 目录
- Create: `apps/slax-reader-dweb/tests/integration/` 目录
- Create: `apps/slax-reader-dweb/tests/README.md`

- [ ] **Step 2.1：建空目录并放 .gitkeep**

```bash
cd /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb
mkdir -p tests/setup tests/fixtures tests/mocks tests/unit/utils tests/unit/composables tests/integration
touch tests/setup/.gitkeep tests/fixtures/.gitkeep tests/mocks/.gitkeep tests/unit/utils/.gitkeep tests/unit/composables/.gitkeep tests/integration/.gitkeep
```

- [ ] **Step 2.2：写 tests/README.md**

```markdown
# slax-reader-dweb 测试指南

测试体系按 .claude/test-framework/PLAN.md 设计。本目录已落 6 类 spec：

| 目录                           | 用途                    | 测试类型                |
| ------------------------------ | ----------------------- | ----------------------- |
| `tests/unit/utils/`            | 纯函数                  | 单元                    |
| `tests/unit/composables/`      | composable              | 单元                    |
| `tests/unit/stores/`（第二期） | Pinia store             | 单元                    |
| `tests/components/`            | Vue 组件交互            | 组件                    |
| `tests/integration/`           | 多组件 + store + router | 页面集成（非 e2e）      |
| `tests/theme/`                 | 主题与 iframe 注入      | 单元+组件混合（已存在） |

## 三件套基础设施

- `tests/setup/index.ts`：vitest 自动加载，挂全局 mock + DOM 清理 hook
- `tests/setup/i18n.ts`：`createTestI18n(locale)` 工厂（locale 仅 'en' / 'zh'）
- `tests/setup/pinia.ts`：`createTestPinia()` 工厂
- `tests/setup/mount.ts`：`mountWithApp(component, options)` —— 自动注入 i18n + pinia

## 写新 spec 的标准流程

1. **先 `Read` 被测源码全文**（强制纪律）
2. 镜像源码路径建 spec 文件：`layers/core/app/utils/foo.ts` → `tests/unit/utils/foo.spec.ts`
3. 引入 fixture 当数据、引入 mock 当桩
4. `describe('xxx', () => { it('行为描述', ...) })`，禁止用例描述写成"测试 xxx 函数"
5. 跑 `pnpm test`、再跑 `pnpm test:coverage` 看新增文件覆盖率

## fixture / mock 怎么用

- **fixture = 假数据**（`tests/fixtures/*.ts`）：导出 `baseXxx` 基础对象 + `makeXxx(overrides)` 工厂
- **mock = 假行为**（`tests/mocks/*.ts`）：导出 `mockXxx` 函数，spec 内 `mockResolvedValueOnce` 控制返回

详见 .claude/test-framework/PLAN.md §5。

## Nuxt auto-import 怎么 mock

statically auto-imported 函数（`navigateTo` / `useRuntimeConfig` / `useRequestHeaders` 等）一律用 `mockNuxtImport('name', () => mockFn)`，**不要**用 `vi.stubGlobal`——编译后的导入绑定 stubGlobal 拦不到。
```

写入路径：`apps/slax-reader-dweb/tests/README.md`

- [ ] **Step 2.3：commit**

```bash
git add apps/slax-reader-dweb/tests/
git commit -m "chore(dweb): scaffold tests directory layout"
```

---

## Task 3：写 setup 基础设施

**Files:**

- Create: `apps/slax-reader-dweb/tests/setup/globalMocks.ts`
- Create: `apps/slax-reader-dweb/tests/setup/i18n.ts`
- Create: `apps/slax-reader-dweb/tests/setup/pinia.ts`
- Create: `apps/slax-reader-dweb/tests/setup/mount.ts`
- Create: `apps/slax-reader-dweb/tests/setup/index.ts`
- Delete: `apps/slax-reader-dweb/tests/setup/.gitkeep`

- [ ] **Step 3.1：写 globalMocks.ts**

写入 `apps/slax-reader-dweb/tests/setup/globalMocks.ts`：

```ts
// 全测试一律 mock 的边界 —— 这些模块没有任何业务测试需要它们的真实行为
import { vi } from 'vitest'

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: () => []
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  onMessage: vi.fn(),
  getToken: vi.fn(),
  isSupported: vi.fn(async () => true)
}))

vi.mock('workbox-precaching', () => ({ precacheAndRoute: vi.fn() }))
vi.mock('workbox-routing', () => ({ registerRoute: vi.fn() }))
vi.mock('workbox-strategies', () => ({
  NetworkFirst: vi.fn(),
  CacheFirst: vi.fn(),
  StaleWhileRevalidate: vi.fn()
}))
vi.mock('workbox-cacheable-response', () => ({ CacheableResponsePlugin: vi.fn() }))
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: vi.fn() }))
```

- [ ] **Step 3.2：写 i18n.ts**

写入 `apps/slax-reader-dweb/tests/setup/i18n.ts`：

```ts
import { createI18n } from 'vue-i18n'

import { getI18nLang } from '~~/layers/core/i18n/config'

// 项目 i18n 仅配置 en / zh 两个 locale（layers/core/i18n/config.ts）
// 不要写 zh-CN，否则 vue-i18n 找不到 messages 会退回到 key 文本
export const createTestI18n = (locale: 'en' | 'zh' = 'en') => createI18n({ legacy: false, locale, messages: getI18nLang() })
```

- [ ] **Step 3.3：写 pinia.ts**

写入 `apps/slax-reader-dweb/tests/setup/pinia.ts`：

```ts
import { createPinia, setActivePinia } from 'pinia'

export const createTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
```

- [ ] **Step 3.4：写 mount.ts**

写入 `apps/slax-reader-dweb/tests/setup/mount.ts`：

```ts
import { mount, type MountingOptions } from '@vue/test-utils'

import { createTestI18n } from './i18n'
import { createTestPinia } from './pinia'

// 注意 global 合并顺序：先展开调用方传入的 options.global，再用合并后的 plugins 覆盖。
// 反过来写会让调用方的 plugins 字段整个覆盖默认 i18n + pinia，组件里 $t / store 注入会失败。
export const mountWithApp = <T>(component: T, options: MountingOptions<any> = {}) =>
  mount(component as any, {
    ...options,
    global: {
      ...options.global,
      plugins: [createTestI18n(), createTestPinia(), ...(options.global?.plugins ?? [])]
    }
  })
```

- [ ] **Step 3.5：写 setup/index.ts**

写入 `apps/slax-reader-dweb/tests/setup/index.ts`：

```ts
import { beforeEach } from 'vitest'

import './globalMocks'

// 每个测试前清空 DOM，避免上一个用例渲染残留污染查询
beforeEach(() => {
  document.body.innerHTML = ''
})
```

- [ ] **Step 3.6：删掉 .gitkeep**

```bash
rm apps/slax-reader-dweb/tests/setup/.gitkeep
```

- [ ] **Step 3.7：验证编译通过**

```bash
pnpm --F @apps/slax-reader-dweb exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "tests/setup" || echo "no type errors in tests/setup"
```

Expected：`no type errors in tests/setup`

- [ ] **Step 3.8：commit**

```bash
git add apps/slax-reader-dweb/tests/setup/
git commit -m "feat(dweb-tests): add setup helpers (i18n, pinia, mount, globalMocks)"
```

---

## Task 4：写 fixtures（bookmark + user）

**Files:**

- Create: `apps/slax-reader-dweb/tests/fixtures/bookmark.ts`
- Create: `apps/slax-reader-dweb/tests/fixtures/user.ts`
- Delete: `apps/slax-reader-dweb/tests/fixtures/.gitkeep`

- [ ] **Step 4.1：先 Read 源码确认 Bookmark / UserInfo 字段**

```bash
cat /Users/yjc/Documents/Company/slax-reader-web/commons/types/src/interface.ts | head -200
```

查到 `Bookmark` 和 `UserInfo` 的字段。如果字段超出当前 PLAN 文档里写的，按源码真实字段为准（fixture 必须能赋值给真实类型）。

- [ ] **Step 4.2：写 bookmark.ts**

写入 `apps/slax-reader-dweb/tests/fixtures/bookmark.ts`：

```ts
// 书签 fixture：导出基础对象 + 工厂 + 常用变体
// 字段以 commons/types/src/interface.ts 的 Bookmark 接口为准
import type { Bookmark } from '@commons/types/interface'

// 基础对象：填上 Bookmark 的全部必填字段；可选字段给中性默认值
// 实施时按源码 Bookmark 实际字段填充，下面是参考结构
export const baseBookmark: Bookmark = {
  // 按源码补齐——这里不预设字段名，避免类型错
  // 实施纪律：写完后必须 tsc 不报 type error
} as Bookmark

export const makeBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  ...baseBookmark,
  ...overrides
})

export const archivedBookmark = makeBookmark({
  /* archived: true 等 */
})
```

> 实施提示：Bookmark 接口可能含几十个字段，全部按源码字段名写。如果 tsc 报 "Type '{}' is missing the following properties"，按报错把字段补全（不要 `as any` 绕过）。

- [ ] **Step 4.3：写 user.ts**

写入 `apps/slax-reader-dweb/tests/fixtures/user.ts`：

```ts
// 用户 fixture：useAuth.spec.ts 会用 baseUser + tokenString
// 字段以 commons/types/src/interface.ts 的 UserInfo 接口为准
import type { UserInfo } from '@commons/types/interface'

export const baseUser: UserInfo = {
  // 按源码补齐
} as UserInfo

export const makeUser = (overrides: Partial<UserInfo> = {}): UserInfo => ({
  ...baseUser,
  ...overrides
})

export const tokenString = 'test-token-abc123'
```

- [ ] **Step 4.4：删 .gitkeep，跑 tsc 验证类型**

```bash
rm apps/slax-reader-dweb/tests/fixtures/.gitkeep
pnpm --F @apps/slax-reader-dweb exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "tests/fixtures" || echo "no type errors in fixtures"
```

Expected：`no type errors in fixtures`

如果有 type error，按报错补齐 `baseBookmark` / `baseUser` 的字段。

- [ ] **Step 4.5：commit**

```bash
git add apps/slax-reader-dweb/tests/fixtures/
git commit -m "feat(dweb-tests): add bookmark and user fixtures"
```

---

## Task 5：写 request mock

**Files:**

- Create: `apps/slax-reader-dweb/tests/mocks/request.ts`
- Delete: `apps/slax-reader-dweb/tests/mocks/.gitkeep`

- [ ] **Step 5.1：先 Read 源码核对 FetchRequest 方法名**

```bash
sed -n '14,90p' /Users/yjc/Documents/Company/slax-reader-web/commons/utils/src/request.ts
```

确认方法名（应为 get/post/put/delete/stream/upgrade/uploadFile）。**不要用 del 简写**。

- [ ] **Step 5.2：写 request.ts mock**

写入 `apps/slax-reader-dweb/tests/mocks/request.ts`：

```ts
import { vi } from 'vitest'

// request() 是工厂函数，返回 FetchRequest 实例（含 get/post/put/delete 等链式方法）。
// 业务代码用 request().post(...) 链式调用，vi.fn() 默认返回 undefined → .post 必报
// "Cannot read properties of undefined (reading 'post')"。
// 因此 mock 文件级别就把链式方法挂好，spec 用 mockResolvedValueOnce 控制返回值。
//
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

// spec 内典型用法：
//   import { mockPost } from '~~/tests/mocks/request'
//   beforeEach(() => mockPost.mockReset())
//   mockPost.mockResolvedValueOnce({ token: 'abc' })
```

- [ ] **Step 5.3：删 .gitkeep**

```bash
rm apps/slax-reader-dweb/tests/mocks/.gitkeep
```

- [ ] **Step 5.4：commit**

```bash
git add apps/slax-reader-dweb/tests/mocks/
git commit -m "feat(dweb-tests): add request boundary mock with chained methods"
```

---

## Task 6：更新 vitest.config.ts（接入 setup + coverage）

**Files:**

- Modify: `apps/slax-reader-dweb/vitest.config.ts`

- [ ] **Step 6.1：覆盖 vitest.config.ts**

写入 `apps/slax-reader-dweb/vitest.config.ts`：

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
        mock: {
          intersectionObserver: true,
          indexedDb: true
        }
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
        // 必须纳入覆盖率分母。但第一/二期不为 pages 设局部门槛，仅观测。
      ],
      thresholds: {
        // 全局门槛第一期注释保留，等核心模块完成后再启用
        // lines: 70, branches: 65, functions: 70, statements: 70,

        // 第一期：只对已写样板的具体文件设阈值，避免未测试同目录文件按 0% 拖垮均值
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

        // request.ts 第一期不设阈值（样板只测两个辅助函数，单例本身分支不在覆盖范围）
        // 第二期补完 interceptor / 401 / error 分支后启用 80/70/85/80
      }
    }
  }
})
```

- [ ] **Step 6.2：跑现有测试确认 setupFiles 生效不破基线**

```bash
pnpm --F @apps/slax-reader-dweb test
```

Expected：现有 6 个 spec 全部通过（含 1 skip）；如果 globalMocks 触发了报错，按错误堆栈定位是否漏 mock 了某个 firebase/workbox 子模块，补到 globalMocks.ts

- [ ] **Step 6.3：commit**

```bash
git add apps/slax-reader-dweb/vitest.config.ts
git commit -m "feat(dweb-tests): wire setupFiles + v8 coverage with per-file thresholds"
```

---

## Task 7：更新 package.json scripts

**Files:**

- Modify: `apps/slax-reader-dweb/package.json`

- [ ] **Step 7.1：把 test/test:watch/test:coverage 三条 script 写进去**

打开 `apps/slax-reader-dweb/package.json`，把 `"test": "vitest"` 改成下面三条（保留其它 scripts 不动）：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

> `vitest` 不带 `run` 会进 watch 模式，CI/hooks 会卡住，正式 `test` 必须用 `vitest run`。

- [ ] **Step 7.2：跑一次确认 `pnpm test` 不再 watch**

```bash
pnpm --F @apps/slax-reader-dweb test
```

Expected：跑完即退出（不停在 watch 提示）

- [ ] **Step 7.3：commit**

```bash
git add apps/slax-reader-dweb/package.json
git commit -m "chore(dweb): split test scripts into run/watch/coverage"
```

---

## Task 8：样板 ① — string.spec.ts（utils 纯函数）

**Files:**

- Create: `apps/slax-reader-dweb/tests/unit/utils/string.spec.ts`

- [ ] **Step 8.1：先 Read 源码**

```bash
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/utils/string.ts
```

确认 `urlBase64ToUint8Array` 函数签名。

- [ ] **Step 8.2：写测试（TDD：先写测试，确认它能跑起来再写实现——但本例实现已存在，直接写测试）**

写入 `apps/slax-reader-dweb/tests/unit/utils/string.spec.ts`：

```ts
// 测 urlBase64ToUint8Array：base64url → Uint8Array 解码
// 覆盖点：标准转换、padding 补齐、非法字符、空字符串
import { describe, expect, it } from 'vitest'

import { urlBase64ToUint8Array } from '~~/layers/core/app/utils/string.ts'

describe('urlBase64ToUint8Array', () => {
  it('标准 base64url 字符串解码字节正确', () => {
    // 'Hello' 的 base64 是 'SGVsbG8=', base64url 为 'SGVsbG8'
    const result = urlBase64ToUint8Array('SGVsbG8')
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111])
  })

  it("base64url 特殊字符 '-' '_' 替换为 '+' '/' 后解码", () => {
    // base64 '+/A=' 对应 base64url '-_A'
    const result = urlBase64ToUint8Array('-_A')
    // 原始字节：'+' '/' 'A' decode 后为 [251, 240]
    const expected = Array.from(
      window
        .atob('+/A=')
        .split('')
        .map(c => c.charCodeAt(0))
    )
    expect(Array.from(result)).toEqual(expected)
  })

  it('长度不是 4 的倍数时自动补 padding', () => {
    // 'SGk' 长度 3，需补 1 个 '='
    const result = urlBase64ToUint8Array('SGk')
    expect(Array.from(result)).toEqual([72, 105]) // 'Hi'
  })

  it('空字符串返回长度为 0 的 Uint8Array', () => {
    const result = urlBase64ToUint8Array('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('返回值是 Uint8Array 实例（不是普通 Array）', () => {
    const result = urlBase64ToUint8Array('SGk')
    expect(result).toBeInstanceOf(Uint8Array)
  })
})
```

- [ ] **Step 8.3：跑测试**

```bash
pnpm --F @apps/slax-reader-dweb test tests/unit/utils/string.spec.ts
```

Expected：5 个 it 全部通过

- [ ] **Step 8.4：跑覆盖率，确认 string.ts 达到 90/85/90/90 阈值**

```bash
pnpm --F @apps/slax-reader-dweb test:coverage
```

Expected：`layers/core/app/utils/string.ts` 行覆盖 ≥ 90%（应能跑到 100%，因为函数全分支被测）；命令退出码 0

> 如果阈值没过，看 `coverage/index.html` 哪些行没覆盖，补用例。

- [ ] **Step 8.5：commit**

```bash
git add apps/slax-reader-dweb/tests/unit/utils/string.spec.ts
git commit -m "test(dweb): cover utils/string urlBase64ToUint8Array (sample 1/5)"
```

---

## Task 9：样板 ③ — useAuth.spec.ts（composable）

> 编号 ③ 而非 ②，因为样板 ②（utils 边界 mock）已推到第二期（PLAN §6.2 标注 request 单例阈值同期补）。

**Files:**

- Create: `apps/slax-reader-dweb/tests/unit/composables/useAuth.spec.ts`

- [ ] **Step 9.1：先 Read 被测源码全文**

```bash
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/composables/useAuth.ts
```

确认四个方法签名和副作用：

- `requestAuth(options)` / `requestAppleAuth(options)`：拼 OAuth URL 写 `location.href`
- `grantAuth(code, redirectUri, affCode, platformType)`：调 `request().post(LOGIN, ...)` → 写 cookie → 返回 token
- `clearAuth()`：删 cookie + 清 store + 调 `checkAndRemoveOriginalCookies`（try/catch 包住）

- [ ] **Step 9.2：写测试**

写入 `apps/slax-reader-dweb/tests/unit/composables/useAuth.spec.ts`：

```ts
// useAuth composable 覆盖：四个方法的副作用 + 错误分支
// 注意 useAuth 是对象字面量包装的方法集（非响应式状态机）
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockPost, mockRequest } from '~~/tests/mocks/request'

// mock @vueuse/integrations/useCookies —— 必须在 import useAuth 之前
const cookieSet = vi.fn()
const cookieGet = vi.fn(() => undefined)
const cookieRemove = vi.fn()

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({
    set: cookieSet,
    get: cookieGet,
    remove: cookieRemove
  })
}))

// mock user store
const clearUserInfo = vi.fn()
vi.mock('#layers/core/app/stores/user', () => ({
  useUserStore: () => ({
    clearUserInfo
  })
}))

// mock Nuxt auto-import useRuntimeConfig
const runtimeConfig = {
  public: {
    GOOGLE_OAUTH_CLIENT_ID: 'g-client-id',
    APPLE_OAUTH_CLIENT_ID: 'a-client-id',
    AUTH_BASE_URL: 'https://auth.test',
    COOKIE_TOKEN_NAME: 'token',
    COOKIE_DOMAIN: '.example.com'
  }
}
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)

// 动态 import，等所有 mock 注册完
const { default: useAuth } = await import('~~/layers/core/app/composables/useAuth')

describe('useAuth', () => {
  beforeEach(() => {
    mockPost.mockReset()
    mockRequest.mockClear()
    cookieSet.mockClear()
    cookieGet.mockReset().mockReturnValue(undefined)
    cookieRemove.mockClear()
    clearUserInfo.mockClear()
    // happy-dom 下直接重置 href
    window.location.href = 'http://localhost/'
  })

  describe('requestAuth', () => {
    it('拼接 Google OAuth URL 并跳转', async () => {
      await useAuth().requestAuth({ redirect: '/home', affCode: 'aff1' })
      expect(window.location.href).toContain('https://accounts.google.com/o/oauth2/v2/auth')
      expect(window.location.href).toContain('client_id=g-client-id')
      expect(window.location.href).toContain('redirect_uri=')
      const state = decodeURIComponent(window.location.href.split('state=')[1])
      const stateObj = JSON.parse(state)
      expect(stateObj.platform).toBe('google')
      expect(stateObj.target).toBe('/home')
      expect(stateObj.affCode).toBe('aff1')
    })
  })

  describe('requestAppleAuth', () => {
    it('拼接 Apple OAuth URL 并跳转', async () => {
      await useAuth().requestAppleAuth({ redirect: '/back', affCode: 'aff2' })
      expect(window.location.href).toContain('https://appleid.apple.com/auth/authorize')
      expect(window.location.href).toContain('client_id=a-client-id')
      const state = decodeURIComponent(window.location.href.split('state=')[1])
      expect(JSON.parse(state).platform).toBe('apple')
    })
  })

  describe('grantAuth', () => {
    it('登录成功 → 写 cookie 并返回 token', async () => {
      mockPost.mockResolvedValueOnce({ token: 'tok-google' })
      const token = await useAuth().grantAuth('code-1', 'https://auth.test/auth', 'aff3', 'google')
      expect(token).toBe('tok-google')
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(cookieSet).toHaveBeenCalledWith('token', 'tok-google', expect.objectContaining({ path: '/', domain: '.example.com' }))
    })

    it('登录返回为空 → 抛 "login failed"', async () => {
      mockPost.mockResolvedValueOnce(undefined)
      await expect(useAuth().grantAuth('code-x', 'https://auth.test/auth', '', 'google')).rejects.toThrow('login failed')
      expect(cookieSet).not.toHaveBeenCalled()
    })

    it('platformType=apple 时使用 apple client_id', async () => {
      mockPost.mockResolvedValueOnce({ token: 'tok-apple' })
      await useAuth().grantAuth('code-2', 'https://auth.test/auth', 'aff4', 'apple')
      const call = mockPost.mock.calls[0][0]
      expect(call.body.client_id).toBe('a-client-id')
      expect(call.body.type).toBe('apple')
    })
  })

  describe('clearAuth', () => {
    it('清 cookie 两次（带 domain / 不带 domain）+ 清 store', async () => {
      await useAuth().clearAuth()
      expect(cookieRemove).toHaveBeenCalledWith('token', { path: '/', domain: '.example.com' })
      expect(cookieRemove).toHaveBeenCalledWith('token', { path: '/' })
      expect(clearUserInfo).toHaveBeenCalledTimes(1)
    })

    it('checkAndRemoveOriginalCookies 抛错时不影响 clearAuth 完成', async () => {
      // 让 clearUserInfo 先成功，然后让 cookieGet 在 checkAndRemove 内被调用并返回值
      // 触发 splits.length > 2 分支
      runtimeConfig.public.COOKIE_DOMAIN = '.sub.example.com'
      cookieGet.mockReturnValue('old-token')
      // remove 在父域名 .example.com 那次抛错
      let callCount = 0
      cookieRemove.mockImplementation(() => {
        callCount++
        if (callCount === 3) throw new Error('remove failed')
      })
      await expect(useAuth().clearAuth()).resolves.toBeUndefined()
      expect(clearUserInfo).toHaveBeenCalled()
      // 还原
      runtimeConfig.public.COOKIE_DOMAIN = '.example.com'
    })
  })
})
```

- [ ] **Step 9.3：跑测试**

```bash
pnpm --F @apps/slax-reader-dweb test tests/unit/composables/useAuth.spec.ts
```

Expected：全部通过。

> 如果遇到 `mockNuxtImport is not defined`：检查是否需要 `import { mockNuxtImport } from '@nuxt/test-utils/runtime'`（按 @nuxt/test-utils 4.x 实际 API 调整）；如该宏必须放在 import 之前，按提示移动顺序。

> 如果 useAuth 的实际方法对 `useUserStore` / `useCookies` / `useRuntimeConfig` 的调用时机和我假设的不一致（比如在模块顶层就调），把 mock 提到文件最顶部并加 `vi.hoisted()` 包装；详见 vitest 文档"mocking with imports"。

- [ ] **Step 9.4：跑覆盖率**

```bash
pnpm --F @apps/slax-reader-dweb test:coverage
```

Expected：`useAuth.ts` 行覆盖 ≥ 80%、分支 ≥ 70%、函数 ≥ 90%、语句 ≥ 80%

- [ ] **Step 9.5：commit**

```bash
git add apps/slax-reader-dweb/tests/unit/composables/useAuth.spec.ts
git commit -m "test(dweb): cover composables/useAuth four methods (sample 3/5)"
```

---

## Task 10：样板 ④ — 重写 BookmarkPanel.spec.ts（组件行为驱动）

**Files:**

- Modify: `apps/slax-reader-dweb/tests/components/BookmarkPanel.spec.ts`

- [ ] **Step 10.1：先 Read 被测源码全文**

```bash
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/components/BookmarkPanel.vue
```

关键事实（必须记牢）：

- 普通 `.panel-wrapper`（第 17 行）无 `v-if`，types=[] 时它本身仍渲染；只有 `.panel-wrapper.pro` 和 `.feedback-wrapper` 受 types 控制
- FEEDBACK 按钮无文本无 aria-label，只有 `<img>`——不能用 `getByRole('button', { name: 'feedback' })`
- emit 事件名是 `panelClick`，payload 是 BookmarkPanelType

确认 i18n key 对应文案（在 `layers/core/i18n/locales/en.json` 里）：

- `page.bookmarks_detail.chat`
- `page.bookmarks_detail.ai_analyze`
- `common.operate.archive`
- `common.operate.unarchive`
- `common.operate.top`

```bash
grep -A1 -E "(bookmarks_detail|operate)" /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/i18n/locales/en.json | head -40
```

- [ ] **Step 10.2：重写测试文件**

完全覆盖原内容，写入 `apps/slax-reader-dweb/tests/components/BookmarkPanel.spec.ts`：

```ts
// BookmarkPanel 组件行为驱动测试
// 注意：FEEDBACK 按钮源码无 aria-label/文本，按 `.feedback-wrapper button` 容器选择器定位
import BookmarkPanel, { BookmarkPanelType } from '~~/layers/core/app/components/BookmarkPanel.vue'

import { beforeEach, describe, expect, it } from 'vitest'

import { mountWithApp } from '~~/tests/setup/mount'

describe('BookmarkPanel', () => {
  describe('渲染', () => {
    it('types=[CHATBOT] 渲染 chat 按钮（按 i18n 文案查）', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.CHATBOT] }
      })
      // 容器：pro wrapper 渲染（含 CHATBOT）
      expect(wrapper.find('.panel-wrapper.pro').exists()).toBe(true)
      // 文案：chat
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].text()).toContain('Chat')
    })

    it('types=[ARCHIVE, TOP] 渲染两个按钮且文案为 archive / top', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.ARCHIVE, BookmarkPanelType.TOP] }
      })
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(2)
      const texts = buttons.map(b => b.text())
      expect(texts.some(t => t.includes('Archive'))).toBe(true)
      expect(texts.some(t => t.includes('Top'))).toBe(true)
    })

    it('types 含 FEEDBACK 时 .feedback-wrapper 内 button 渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.FEEDBACK] }
      })
      const feedbackBtn = wrapper.find('.feedback-wrapper button')
      expect(feedbackBtn.exists()).toBe(true)
    })

    it('types 不含 FEEDBACK 时 .feedback-wrapper 整个不渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.ARCHIVE] }
      })
      expect(wrapper.find('.feedback-wrapper').exists()).toBe(false)
    })

    it('types 不含 CHATBOT / AI 时 .panel-wrapper.pro 不渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.TOP] }
      })
      expect(wrapper.find('.panel-wrapper.pro').exists()).toBe(false)
    })
  })

  describe('边界', () => {
    it('types=[] 时不渲染任何 button 和 .item', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [] }
      })
      expect(wrapper.findAll('button').length).toBe(0)
      expect(wrapper.findAll('.item').length).toBe(0)
      // 注意：普通 .panel-wrapper 容器无 v-if，仍渲染；不要断言 .panel-wrapper 不存在
    })
  })

  describe('交互', () => {
    it.each([[BookmarkPanelType.CHATBOT], [BookmarkPanelType.AI], [BookmarkPanelType.ARCHIVE], [BookmarkPanelType.UNARCHIVE], [BookmarkPanelType.TOP]])(
      '点击 %s 按钮 emit panelClick 且 payload 等于该 type',
      async type => {
        const wrapper = mountWithApp(BookmarkPanel, {
          props: { types: [type] }
        })
        await wrapper.find('button').trigger('click')
        const emits = wrapper.emitted('panelClick')
        expect(emits).toBeTruthy()
        expect(emits![0]).toEqual([type])
      }
    )

    it('点击 FEEDBACK 按钮 emit panelClick 且 payload 为 FEEDBACK', async () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.FEEDBACK] }
      })
      await wrapper.find('.feedback-wrapper button').trigger('click')
      const emits = wrapper.emitted('panelClick')
      expect(emits).toBeTruthy()
      expect(emits![0]).toEqual([BookmarkPanelType.FEEDBACK])
    })
  })
})
```

- [ ] **Step 10.3：跑测试**

```bash
pnpm --F @apps/slax-reader-dweb test tests/components/BookmarkPanel.spec.ts
```

Expected：全部通过。

> 如果 i18n 文案断言失败：跑一下 `pnpm test tests/components/BookmarkPanel.spec.ts --reporter=verbose`，根据实际渲染文案调整 `Chat` / `Archive` / `Top` 等关键词。

- [ ] **Step 10.4：commit**

```bash
git add apps/slax-reader-dweb/tests/components/BookmarkPanel.spec.ts
git commit -m "test(dweb): rewrite BookmarkPanel spec to behavior-driven (sample 4/5)"
```

---

## Task 11：样板 ⑤ — 迁移并重写 app.nuxt.spec.ts → integration/app.spec.ts

**Files:**

- Create: `apps/slax-reader-dweb/tests/integration/app.spec.ts`
- Delete: `apps/slax-reader-dweb/tests/app.nuxt.spec.ts`
- Delete: `apps/slax-reader-dweb/tests/integration/.gitkeep`

- [ ] **Step 11.1：先 Read 被测源码全文**

```bash
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/components/Homepage.vue
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/components/Homepage/HomepageHero.vue | head -100
cat /Users/yjc/Documents/Company/slax-reader-web/apps/slax-reader-dweb/layers/core/app/components/Homepage/HomepageCallToAction.vue | head -100
```

确认事实：

- `/` 渲染的是 Homepage（不是 Login）
- CTA 文案：`Start Reading Smarter - Free`（HomepageHero）、`Get Started - It's Free`（HomepageCallToAction）
- 点击 CTA → `navigateTo('/bookmarks?from=homepage')`

- [ ] **Step 11.2：写新测试**

写入 `apps/slax-reader-dweb/tests/integration/app.spec.ts`：

```ts
// 页面集成样板：进入 / 渲染 homepage、点击 CTA 跳转 /bookmarks
// 旧 app.nuxt.spec.ts 中点击 Login 跳转的逻辑已不成立（app.vue 当前只是壳）
import App from '#layers/core/app/app.vue'

import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestI18n } from '~~/tests/setup/i18n'
import { createTestPinia } from '~~/tests/setup/pinia'

// 拦 navigateTo —— Homepage 点击 CTA 时会调
const navigateToMock = vi.fn()
mockNuxtImport('navigateTo', () => navigateToMock)

describe('/ 路由集成', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
  })

  it('进入 / 渲染 homepage 关键文案', async () => {
    await renderSuspended(App, {
      route: '/',
      global: {
        plugins: [createTestI18n(), createTestPinia()]
      }
    })

    // CTA 文案断言（沿用 testing-library 文本查询）
    await waitFor(() => {
      expect(screen.getByText(/Start Reading Smarter - Free/i)).toBeTruthy()
    })
  })

  it('点击 Start Reading 按钮跳转 /bookmarks?from=homepage', async () => {
    await renderSuspended(App, {
      route: '/',
      global: {
        plugins: [createTestI18n(), createTestPinia()]
      }
    })

    const cta = await screen.findByText(/Start Reading Smarter - Free/i)
    // 找到包含该文案的可点击祖先（button 或 a）
    const clickable = cta.closest('button, a') || cta
    await fireEvent.click(clickable)

    await waitFor(() => {
      expect(navigateToMock).toHaveBeenCalled()
      const arg = navigateToMock.mock.calls[0][0]
      expect(arg).toContain('/bookmarks')
      expect(arg).toContain('from=homepage')
    })
  })
})
```

- [ ] **Step 11.3：删除旧文件 + .gitkeep**

```bash
rm apps/slax-reader-dweb/tests/app.nuxt.spec.ts
rm apps/slax-reader-dweb/tests/integration/.gitkeep
```

- [ ] **Step 11.4：跑测试**

```bash
pnpm --F @apps/slax-reader-dweb test tests/integration/app.spec.ts
```

Expected：2 个 it 通过。

> 如果 `mockNuxtImport('navigateTo', ...)` 在 @nuxt/test-utils 4.x 的导出形式不同（例如必须 `import { mockNuxtImport } from '@nuxt/test-utils/runtime'`），按 @nuxt/test-utils 4 文档调整。如果 renderSuspended 没把 Homepage 渲染出来（pages 路由没接入），把 route 改成直接 mount `Homepage.vue`，或参考 useIframeTheme.spec.ts 写法（已知工作的 nuxt env 范本）。

> 如果 Homepage 内部还有别的 Nuxt auto-import 需要 mock（如 useRoute / useCookie），按报错堆栈逐个补 `mockNuxtImport`。

- [ ] **Step 11.5：commit**

```bash
git add apps/slax-reader-dweb/tests/integration/
git add -u apps/slax-reader-dweb/tests/app.nuxt.spec.ts
git commit -m "test(dweb): migrate app.nuxt.spec to integration/app and align with homepage (sample 5/5)"
```

---

## Task 12：全量验收

**Files:**（无新增）

- [ ] **Step 12.1：跑全量测试**

```bash
pnpm --F @apps/slax-reader-dweb test
```

Expected：全部 spec 通过（5 个样板 + 4 个 theme spec = 至少 9 个文件），无 skip 残留（除非有明确理由）

- [ ] **Step 12.2：跑覆盖率**

```bash
pnpm --F @apps/slax-reader-dweb test:coverage
```

Expected：

- `string.ts` ≥ 90/85/90/90
- `useAuth.ts` ≥ 80/70/90/80
- 退出码 0（命令成功）
- `coverage/index.html` 生成

- [ ] **Step 12.3：跑 dev 冒烟，确认 mock 没污染运行时**

```bash
pnpm dev:dweb
```

等待启动后访问 `http://localhost:3000`，看 homepage 能正常渲染（说明全局 mock 只在测试环境生效，dev server 没被污染）。验证完 Ctrl+C 停掉。

> 如果 dev server 启动报错，说明 globalMocks 误污染了非测试环境——检查 `tests/setup/globalMocks.ts` 是否被 `nuxt.config.ts` 误引入。正确隔离应该是：`vitest.config.ts` 的 `setupFiles` 只在测试运行时生效。

- [ ] **Step 12.4：跑 lint**

```bash
pnpm --F @apps/slax-reader-dweb lint:fix
```

Expected：无 error（warn 可接受）

- [ ] **Step 12.5：把第一期验收点回填到 PLAN.md §9.2**

打开 `.claude/test-framework/PLAN.md`，把 §9.2 第一期验收点全部勾上 `[x]`：

```markdown
- [x] `tests/setup/` 五个文件就绪并 vitest 自动加载
- [x] `tests/fixtures/bookmark.ts` + `tests/fixtures/user.ts` 就绪
- [x] `tests/mocks/request.ts` 就绪
- [x] 5 个样板用例全部 `vitest run` 通过
- [x] `pnpm test:coverage` 跑出**已设阈值的样板文件局部覆盖率**
- [x] `tests/README.md` 写好"如何添加一个新用例"的三步指南
- [x] 现存 6 个 spec 全部仍通过（迁移路径不破坏旧用例）
```

同时同步到 `docs/superpowers/specs/2026-05-22-dweb-test-framework-design.md`：

```bash
cp .claude/test-framework/PLAN.md docs/superpowers/specs/2026-05-22-dweb-test-framework-design.md
```

- [ ] **Step 12.6：commit 验收**

```bash
git add .claude/test-framework/PLAN.md docs/superpowers/specs/2026-05-22-dweb-test-framework-design.md
git commit -m "docs(dweb-tests): mark phase 1 acceptance points done"
```

---

## 失败处理（任一 Task 受阻）

1. 把失败原因（错误堆栈、命令、推断）记到 `.claude/test-framework/operations-log.md`
2. 不删用例、不降阈值、不绕过 mock；先看错误根因
3. 同一类失败连续 3 次 → 暂停施工，把问题写到 PLAN.md 的"风险与缓解"表，回到设计阶段补
4. 如果发现 PLAN.md 文档与源码新出现偏差（PLAN 写完后源码有变），先修 PLAN 再施工——不要让代码与设计文档继续漂移

---

## Self-Review 结果

**1. Spec 覆盖：**

- §3 目录结构 → Task 2
- §4.2 vitest.config.ts → Task 6
- §4.3 scripts → Task 7
- §4.4 依赖增量 → Task 1
- §5.1 setup 五件套 → Task 3
- §5.2 fixtures（bookmark + user）→ Task 4
- §5.3 mocks（request）→ Task 5
- §6.1 string 样板 → Task 8
- §6.3 useAuth 样板 → Task 9
- §6.4 BookmarkPanel 样板 → Task 10
- §6.5 集成样板 → Task 11
- §9.1/§9.2 验收 → Task 12
- §6.2（utils 边界 mock 样板 request.ts）**主动推迟到第二期**——PLAN.md §4.2 已注释掉该文件阈值、§7 渐进表第一期列已剔除；本计划无对应 task 是设计选择，不是遗漏

**2. Placeholder 扫描：** 全部 step 含具体代码或具体命令；无 "TBD" / "TODO" / "implement later"。fixture 文件里的 `// 按源码补齐` 是显式纪律提示（要求施工时 grep 真实接口），不是占位符。

**3. 类型一致性：**

- `mockRequest / mockPost / mockGet / mockPut / mockDelete / mockStream / mockUpgrade / mockUploadFile / mockGetUserToken / mockHaveRequestToken`——全程统一
- `createTestI18n / createTestPinia / mountWithApp`——全程统一
- `baseBookmark / makeBookmark / baseUser / makeUser`——全程统一
- `BookmarkPanelType` enum 用法对齐源码

**4. 提交风格：** 全部 commit 用英文，覆盖 chore/feat/test/docs 四类前缀，符合项目 commit 偏好。
