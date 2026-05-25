# slax-reader-dweb 测试指南

测试体系按 .claude/test-framework/PLAN.md 设计。第三期 Sprint 0（2026-05-25）完成目录合并：原 `tests/components/` 并入 `tests/unit/components/`，三层简化为 unit / integration / e2e（第三期新增） / theme。

| 目录                       | 用途                          | 测试类型               |
| -------------------------- | ----------------------------- | ---------------------- |
| `tests/unit/utils/`        | 纯函数                        | 单元                   |
| `tests/unit/composables/`  | composable                    | 单元                   |
| `tests/unit/stores/`       | Pinia store                   | 单元                   |
| `tests/unit/components/`   | Vue 组件交互                  | 单元（含 ce.vue 单测） |
| `tests/integration/`       | 多组件 + store + router       | 页面集成（非 e2e）     |
| `tests/integration/pages/` | pages 集成（第三期 Sprint 4） | 页面集成               |
| `tests/e2e/`               | 真实浏览器（第三期 Sprint 2） | Playwright             |
| `tests/theme/`             | 主题与 iframe 注入            | 单元+组件混合（已有）  |

## 三件套基础设施

- `tests/setup/index.ts`：vitest 自动加载，挂全局 mock + DOM 清理 hook
- `tests/setup/i18n.ts`：`createTestI18n(locale)` 工厂（locale 仅 'en' / 'zh'）
- `tests/setup/pinia.ts`：`createTestPinia()` 工厂
- `tests/setup/mount.ts`：`mountWithApp(component, options)` —— 自动注入 i18n + pinia

## 写新 spec 的标准流程

1. **先 `Read` 被测源码全文**（强制纪律）
2. 镜像源码路径建 spec 文件：`layers/core/app/utils/foo.ts` → `tests/unit/utils/foo.spec.ts`；组件 `layers/core/app/components/Foo/Bar.vue` → `tests/unit/components/Foo/Bar.spec.ts`
3. 引入 fixture 当数据、引入 mock 当桩
4. `describe('xxx', () => { it('行为描述', ...) })`，禁止用例描述写成"测试 xxx 函数"
5. 跑 `pnpm test`、再跑 `pnpm test:coverage` 看新增文件覆盖率

## fixture / mock 怎么用

- **fixture = 假数据**（`tests/fixtures/*.ts`）：导出 `baseXxx` 基础对象 + `makeXxx(overrides)` 工厂
- **mock = 假行为**（`tests/mocks/*.ts`）：导出 `mockXxx` 函数，spec 内 `mockResolvedValueOnce` 控制返回

详见 .claude/test-framework/PLAN.md §5。

## Nuxt auto-import 怎么 mock

statically auto-imported 函数（`navigateTo` / `useRuntimeConfig` / `useRequestHeaders` / `request` 等）一律用 `mockNuxtImport('name', () => mockFn)`，**不要**用 `vi.stubGlobal`——编译后的导入绑定 stubGlobal 拦不到。

**关键约束（施工期发现）**：`mockNuxtImport` 是 macro，被 transform 成 `vi.mock` 后会被 hoist 到文件顶部，此时**跨文件 import 的 binding 仍在 TDZ**——不能从 `tests/mocks/*.ts` import spy 句柄传给 `mockNuxtImport` factory。每个 spec 必须在自己文件内用 `vi.hoisted` 声明 spy。

完整示例参考 [tests/unit/composables/useAuth.spec.ts](unit/composables/useAuth.spec.ts) 顶部 vi.hoisted + mockNuxtImport('request', ...) 的写法。

至于 `tests/mocks/request.ts` 的角色：它仅服务于"被测代码用**显式 import** 形式调 request()"的场景（目前只有 `components/Article/Selection/adapters/DwebHttpClient.ts`）。auto-import 场景请按上面 vi.hoisted 模式自建 mock。详见 mock 文件顶部的两套用法注释。
