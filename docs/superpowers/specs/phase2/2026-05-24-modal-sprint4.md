# 第二期 Sprint 4：utils/modal.ts + components/Modal/index.ts 完整覆盖

> 第二期第四个 sprint。覆盖 PLAN §8 P1 第 5 项 Modal 链路（7 边 god node）：
>
> - `utils/modal.ts`（33 行）：modalBootloader 工厂
> - `components/Modal/index.ts`（113 行）：6 个 showXxxModal helper

**Goal**：两个文件覆盖到阈值并启用门槛。modalBootloader 是 Vue 动态挂载机制（createApp + mount document.body），6 个 helper 走 modalBootloader 透传 props。

**前置文档**：

- `.claude/test-framework/PLAN.md` §8 P1 第 5 项
- 沉淀范式：sprint 1（vi.hoisted + mockNuxtImport）+ sprint 2（vi.spyOn 替代 mock）+ sprint 3（vi.stubGlobal）

**强制纪律**（继承）：

1. 写 spec 前必须 Read 被测源码
2. 不用 `as any` / `@ts-ignore` / 过松断言
3. commit message 英文
4. spec 文档落盘后过 `.claude/test-framework/codex-review-loop.sh` 多轮 codex review，全过/驳回再施工

---

## 1. 被测面分析

### 1.1 `utils/modal.ts`（33 行）

`modalBootloader(options: { ele, props, container? })` 行为：

1. `createApp(ele, props)`
2. 取 `app._component.__name` 拼 className `modal_component_${name}`
3. `document.querySelector('.${className}')` 找已挂的元素：
   - 找不到 / name 缺失 → 创建新 div + 设 className（仅 name 存在时）+ 设 z-index=100 + 应用 container.styles + appendChild 到 document.body
   - 找到（且 name 存在） → 复用现有元素（**不再重设 styles / 不重新 appendChild**）
4. `app.use(createHead())` + `app.mount(element)` + 返回 app

### 1.2 `components/Modal/index.ts`（113 行）

6 个导出：

| Helper                    | 行号   | ele                 | 关键 props                                                                            |
| ------------------------- | ------ | ------------------- | ------------------------------------------------------------------------------------- |
| `showFeedbackModal`       | 12-27  | Feedback            | reportType / title / href / email / params(默认{}) / onDismiss(unmount + 容器 remove) |
| `showEditNameModal`       | 29-44  | EditName            | name / aliasName(\|\|'') / bookmarkId / onDismiss / onSuccess(透传 callback)          |
| `showEditTagModal`        | 46-63  | EditTag             | tagId / tagName(\|\|'') / onDismiss / onSuccess(callback) / onDelete(deleteCallback)  |
| `showLoginModal`          | 65-74  | LoginModal          | redirect / onDismiss                                                                  |
| `showShareConfigModal`    | 76-87  | ShareModal          | bookmarkId / title / type(\|\|ShareModalType.Bookmark) / onDismiss                    |
| `showSnapshotStatusModal` | 89-104 | SnapshotStatusModal | status / title / content / onDismiss / onConfirm(透传后再 unmount + remove)           |

**关键 onDismiss 行为**：所有 6 个 helper 都有 `onDismiss: () => { app.unmount(); app._container?.remove() }`——除模态自己 unmount + 移除 DOM 容器。

`showSnapshotStatusModal` 的 `onConfirm` 比其它特殊：调用方 callback 后**也**会 unmount + remove（其它只在 onDismiss 时 unmount）。

---

## 2. 测试切分

新建两个 spec 文件（**两个被测在不同目录，不合并**）：

- `apps/slax-reader-dweb/tests/unit/utils/modal.spec.ts`
- `apps/slax-reader-dweb/tests/unit/components/Modal/index.spec.ts`

### 2.1 modal.spec.ts（**8 用例**）

```
describe('modalBootloader', () => {
  describe('首次挂载', () => {
    it('创建新 div + 加 className modal_component_<name> + appendChild 到 document.body')
    it('z-index 设为 100')
    it('container.styles 应用到元素 style')
    it('调 createApp + mount 返回 app 实例')
  })

  describe('复用既有元素', () => {
    it('document 已有同 className 元素 → 不再创建新 div + 不重设 styles + 仍 mount 到该元素')
  })

  describe('边界', () => {
    it('app._component.__name 缺失（匿名组件）→ 不加 className（不写 classList）+ 仍 createElement + appendChild')
    it('options.container 不传 → 不应用 styles，仍设 z-index')
    it('返回的 app 来自 createApp（断言 mount 被调用、use(createHead()) 被调用）')
  })
})
```

合计 8 用例。

### 2.2 components/Modal/index.spec.ts（**12 用例**，每个 helper 2 用例）

每个 helper 测 2 件事：

1. **props 透传**：调 helper(options) → modalBootloader 被调时 ele 是预期组件 / props 含正确字段 / 默认值生效（如 params ?? {}、aliasName || ''、type || Bookmark）
2. **onDismiss / onSuccess / onConfirm 行为**：触发 onDismiss → app.unmount + container.remove 都被调；触发 onSuccess/onConfirm → 调用方 callback 收到正确参数

```
describe('Modal helpers', () => {
  describe('showFeedbackModal', () => {
    it('用 Feedback 组件 + 透传 reportType/title/href/email/params；params 缺失时 fallback {}')
    it('onDismiss 调 app.unmount + 容器 remove')
  })
  describe('showEditNameModal', () => {
    it('用 EditName 组件 + 透传 name/bookmarkId；aliasName 缺失时 fallback ""')
    it('onSuccess(name) 透传给 options.callback；onDismiss 调 unmount + remove')
  })
  describe('showEditTagModal', () => {
    it('用 EditTag 组件 + 透传 tagId/tagName；tagName 为空字符串时仍透传 ""（源码 `tagName || ""` fallback 无效路径，因类型已要求 string）')
    it('onSuccess + onDelete 分别透传给 callback / deleteCallback')
  })
  describe('showLoginModal', () => {
    it('用 LoginModal 组件 + 透传 redirect')
    it('onDismiss 调 unmount + remove')
  })
  describe('showShareConfigModal', () => {
    it('用 ShareModal 组件 + 透传 bookmarkId/title；type 缺失时 fallback ShareModalType.Bookmark')
    it('onDismiss 调 unmount + remove')
  })
  describe('showSnapshotStatusModal', () => {
    it('用 SnapshotStatusModal 组件 + 透传 status/title/content')
    it('onConfirm(dontRemindAgain) 透传给 options.onConfirm 后 unmount + remove；onDismiss 仅 unmount + remove')
  })
})
```

合计 12 用例。

合计 sprint 4：8 + 12 = **20 用例**。

---

## 3. mock 链路

### 3.1 modal.spec.ts mocks（**施工期发现重大约束**）

- **createApp + createHead**：mock `vue` 的 `createApp` —— 但**不能**默认 `vi.fn()`（默认返回 undefined），否则 nuxt-test-utils 的 setupNuxt 在 spec 加载时就调 createApp → `Object.defineProperty called on non-object` 报错、全 skip。**必须默认委派给 actual.createApp**，仅在用例内 `mockImplementationOnce(() => stub)` 注入受控 stub。
- mock `@unhead/vue/client` 的 `createHead` 返回 stub plugin（无 setupNuxt 路径走它）
- **document**：用真 happy-dom document（happy-dom 已支持 querySelector / createElement / body.appendChild）
- **每个用例 beforeEach 清 document.body.innerHTML**——sprint 1 setup/index.ts 已自动做这件事

```ts
import { vi } from 'vitest'

// **关键**：vi.mock 工厂在 spec 加载早期被 hoist 调用，setupNuxt 也会调 createApp。
// 解法：vi.mock factory 内通过 ref 把 actual.createApp 捕获到 hoisted scope，
// createAppMock 默认委派给 actual；用例需要受控 stub 时调 mockImplementationOnce
const { actualCreateAppRef, createAppMock, makeAppStub } = vi.hoisted(() => {
  const actualCreateAppRef: { value: ((...args: unknown[]) => unknown) | null } = { value: null }
  const makeAppStub = (componentName?: string) => ({
    _component: componentName ? { __name: componentName } : {},
    _container: null as HTMLElement | null,
    mount: vi.fn(function (this: any, el: HTMLElement) {
      this._container = el
      return this
    }),
    unmount: vi.fn(),
    use: vi.fn()
  })
  const createAppMock = vi.fn((...args: unknown[]) => {
    if (!actualCreateAppRef.value) throw new Error('actualCreateApp not initialized')
    return actualCreateAppRef.value(...args) // 默认委派给 actual，setupNuxt 路径走通
  })
  return { actualCreateAppRef, createAppMock, makeAppStub }
})

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  actualCreateAppRef.value = actual.createApp as unknown as (...args: unknown[]) => unknown
  return { ...actual, createApp: createAppMock }
})

vi.mock('@unhead/vue/client', () => ({
  createHead: () => ({ install: vi.fn() })
}))
```

**用例内注入 stub 写法**：

```ts
it('创建新 div + 加 className modal_component_<name>', () => {
  const stub = makeAppStub('Foo')
  createAppMock.mockImplementationOnce(() => stub)
  modalBootloader({ ele: { name: 'Foo' } as any, props: {} })
  expect(document.querySelector('.modal_component_Foo')).toBeTruthy()
  expect(stub.mount).toHaveBeenCalled()
})
```

`mockImplementationOnce` 只对**下一次**调用生效，之后调用回落到默认委派——既能受控测 modalBootloader 的行为，又不破坏 setupNuxt 的 createApp 路径。

> **关键**：`vi.mock('vue', ...)` 必须 spread `actual`——modalBootloader 只用 createApp，但其它 spec 文件可能间接 import vue 其它东西（比如 setupNuxt 内部）。

### 3.2 Modal/index.spec.ts mocks

- **utils/modal**：mock `#layers/core/app/utils/modal` 的 modalBootloader，让它返回受控 app stub，spec 直接断言 modalBootloader 接收的 ele/props
- **6 个组件 .vue 文件**：mock 让它们返回简单 stub（避免 modalBootloader 真渲染）

```ts
// modalBootloader 调用时透传给它的 options 形状
type ModalBootloaderArgs = {
  ele: unknown
  props: Record<string, unknown>
  container?: { styles: Record<string, unknown> }
}

const { modalBootloaderMock, lastCall } = vi.hoisted(() => {
  const lastCall: { value: ModalBootloaderArgs | null } = { value: null }
  return {
    lastCall,
    modalBootloaderMock: vi.fn((options: ModalBootloaderArgs) => {
      lastCall.value = options
      return {
        unmount: vi.fn(),
        _container: { remove: vi.fn() }
      }
    })
  }
})

vi.mock('#layers/core/app/utils/modal', () => ({
  modalBootloader: modalBootloaderMock
}))

// 组件 stub（不渲染真实 .vue）
vi.mock('~~/layers/core/app/components/Modal/Feedback.vue', () => ({ default: { name: 'Feedback' } }))
vi.mock('~~/layers/core/app/components/Modal/EditName.vue', () => ({ default: { name: 'EditName' } }))
vi.mock('~~/layers/core/app/components/Modal/EditTag.vue', () => ({ default: { name: 'EditTag' } }))
vi.mock('~~/layers/core/app/components/Modal/LoginModal.vue', () => ({ default: { name: 'LoginModal' } }))
vi.mock('~~/layers/core/app/components/Modal/ShareModal.vue', () => ({
  default: { name: 'ShareModal' },
  // 真实 enum：apps/slax-reader-dweb/layers/core/app/components/Modal/ShareModal.vue 顶部
  // export enum ShareModalType { Bookmark = 'bookmark', Original = 'original' }
  // 不要 mock 成不存在的 'Article' 等值，否则"非默认 type 透传"用例会假阳性
  ShareModalType: { Bookmark: 'bookmark', Original: 'original' }
}))
vi.mock('~~/layers/core/app/components/Modal/SnapshotStatusModal.vue', () => ({ default: { name: 'SnapshotStatusModal' } }))
```

> **关键**：源码 components/Modal/index.ts 用相对 import `./Feedback.vue` 等。spec 用 vi.mock 必须用**能命中源文件解析后绝对路径**的写法——按 vitest 实测，`~~/layers/core/app/components/Modal/Xxx.vue` 是 nuxt env 下 alias 解析后的绝对路径，能命中。**不要**用 `./components/Modal/Xxx.vue`（spec 所在目录到不了源码）；`mockNuxtImport` 也用不上（不是 auto-import 是静态相对 import）。
>
> 如果实施时实测 `~~/...` 仍不命中，fallback 用文件系统绝对路径 `vi.mock('/Users/.../layers/core/app/components/Modal/Xxx.vue', ...)`（vitest 接受绝对路径），或者 `vi.mock(import.meta.resolve('~~/layers/core/app/components/Modal/Xxx.vue'), ...)`。

### 3.3 不需要 mock

- happy-dom document.body / querySelector / createElement / appendChild 全部真用
- @commons/types/interface 的 BookmarkParseStatus（showSnapshotStatusModal 用）真用——是 enum

---

## 4. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts` 在现有 thresholds 块**追加**：

```ts
'layers/core/app/utils/modal.ts': {
  lines: 80, branches: 70, functions: 85, statements: 80
},
'layers/core/app/components/Modal/index.ts': {
  lines: 80, branches: 70, functions: 85, statements: 80
}
```

预期实测：两个文件都应 100 全维度（modal.ts 分支少全测；index.ts 6 个 helper 各 2 用例已覆盖默认值/回调透传）。

---

## 5. Sprint 4 任务拆分（1 个 task，串行）

> 体量小（20 用例），不拆 sub-sprint。

### Task 1：双 spec + 启用阈值

1. 写 `tests/unit/utils/modal.spec.ts`（8 用例）
2. 跑单文件验证 8 passed
3. 写 `tests/unit/components/Modal/index.spec.ts`（12 用例）
4. 跑单文件验证 12 passed
5. 跑全量验证 165 passed (145 + 20)
6. 跑 coverage 拿 modal.ts + Modal/index.ts 实测值
7. 修改 vitest.config.ts 启用两个单文件阈值
8. 再跑 coverage 验证退出码 0

commit：`test(dweb): cover modal bootloader + 6 modal helpers, enable thresholds (sprint 4)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `vi.mock('vue', ...)` 与 nuxt-test-utils 自动注入的 vue 上下文冲突，导致其它 spec 失败 | 中 | spread `actual` + 仅替换 createApp；如出现 sprint 1-3 用例回归，立即汇报详情 |
| Modal/index.ts 内部用相对 `./Feedback.vue` 等 import，vi.mock 用错路径会拦不到 | 高 | 按 §3.2：先用 `~~/layers/core/app/components/Modal/Xxx.vue`；如实测不命中（spec 加载时仍真渲染 .vue 或解析报错），改用文件系统绝对路径 `vi.mock('/Users/.../layers/core/app/components/Modal/Xxx.vue', ...)`，或 `import.meta.resolve('~~/...')` 拿到运行时绝对路径再传给 vi.mock。**禁用** `./components/Modal/Xxx.vue`（spec 目录到不了源码）和 `mockNuxtImport`（不是 auto-import 是静态相对 import） |
| modalBootloader 在 happy-dom 下 `createApp().mount(div)` 是否真挂 DOM | 中 | spec 用 createAppMock 替换，mount 是 spy 不真渲染；happy-dom 不参与 mount 路径 |
| 6 个组件 .vue 加载时间长（spec 启动慢） | 低 | 用 vi.mock 替换为简单 stub，不加载真组件 |
| `app._container` 是 Vue 内部字段，可能未导出类型 | 低 | spec mock 直接构造 `{ remove: vi.fn() }`，不读真实 \_container 内部结构 |

---

## 7. 验收清单

- [ ] 20 用例全过（modal 8 + Modal/index 12）
- [ ] modal.ts 覆盖率 ≥ 80/70/85/80（实测应 100）
- [ ] Modal/index.ts 覆盖率 ≥ 80/70/85/80（实测应 100）
- [ ] vitest.config.ts 启用两个单文件阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 145 → 165 用例通过，0 todo / 0 fail
- [ ] sprint 1-3 共 96 用例（23 request + 54 user + 19 environment/adapter）无回归
- [ ] commit 全英文 message
- [ ] spec 文档过 codex-review-loop.sh 多轮全通过 / 全驳回

## 8. Self-Review

1. ✓ 20 用例覆盖 modalBootloader 全分支（首次/复用/匿名/无 container）+ 6 个 helper 的 props 透传 + 回调路径
2. ✓ vi.mock('vue', ...) 用 importActual spread 避免破坏 setupNuxt
3. ✓ vi.mock 6 个 .vue 用 stub 避免真渲染（实施时确认相对/绝对路径）
4. ✓ spec 顶层 afterEach restoreAllMocks（继承 sprint 3 范式）防 spy 泄漏
5. ✓ 不在本 sprint 范围：测真实模态组件渲染（那是组件级测试，留给后续 sprint 选 P0/P1 时一并做）
