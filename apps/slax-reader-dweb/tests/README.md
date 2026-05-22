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
