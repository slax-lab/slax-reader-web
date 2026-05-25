# slax-reader-dweb 测试框架 第一期 + 第二期总结报告

> 生成时间：2026-05-24分支：`feature/dweb-test-framework-phase1` 参考文档：`.claude/test-framework/lessons-learned.md`（施工期遇到的问题与解决方案）

---

## 一、项目背景

slax-reader-dweb 是基于 Nuxt 4 + Vue 3 的 Web 阅读器应用。在本次测试框架建设之前，仅有 6 个 spec 文件（其中 1 个 skip），覆盖率极低，无 CI 门槛。

**目标**：建立可持续运维的测试体系，覆盖单元 + 组件交互 + 页面集成三层，外部依赖全 mock，分层引入 v8 coverage 门槛。

---

## 二、做了什么事（总览清单）

### 基础设施

- [x] 安装 `@vitest/coverage-v8@^4.1.7`，接入 v8 覆盖率
- [x] 建立 `tests/` 目录结构（setup / fixtures / mocks / unit / components / integration）
- [x] 写 `tests/setup/` 五件套（globalMocks / i18n / pinia / mount / index）
- [x] 写 `tests/fixtures/user.ts`（UserInfo 真实接口 fixture）
- [x] 写 `tests/mocks/request.ts`（request() 链式方法 mock + 两套用法说明）
- [x] 更新 `vitest.config.ts`（setupFiles + v8 coverage + 分层阈值）
- [x] 更新 `package.json` scripts（test / test:watch / test:coverage）
- [x] 更新 `tests/README.md`（含 auto-import mock 约束说明）
- [x] 封装 `codex-review-loop.sh`（codex CLI 多轮 review 循环 helper）

### 第一期样板用例（5 类）

- [x] `tests/unit/utils/string.spec.ts`（utils 纯函数样板，5 用例）
- [x] `tests/unit/composables/useAuth.spec.ts`（composable 样板，8 用例）
- [x] `tests/components/BookmarkPanel.spec.ts`（组件行为驱动重写，12 用例）
- [x] `tests/integration/app.spec.ts`（页面集成样板，2 用例）

### 第二期 Sprint 1：utils/request.ts

- [x] 23 用例（客户端 getUserToken / haveRequestToken / request() 工厂 / 拦截器 + 服务端 ServerRequest / getUserToken / errorInterceptor）
- [x] 验证 `vi.doMock + vi.resetModules` 真切换 isServer（无降级）
- [x] 启用 request.ts 单文件阈值 80/70/85/80

### 第二期 Sprint 2：stores/user.ts

- [x] Sprint 2.1：54 用例（8 getter + 10 纯本地 action + 12 subscribe action + 10 request 类 action + 5 复合 action + 3 changeLocalLocale）
- [x] Sprint 2.2：补完 request 类 + 复合 action
- [x] 启用 stores/user.ts 单文件阈值 80/70/85/80

### 第二期 Sprint 3：utils/environment.ts + DwebEnvironmentAdapter.ts

- [x] 19 用例（environment 13 + DwebEnvironmentAdapter 6）
- [x] 验证 `vi.stubGlobal('navigator', ...)` + afterEach unstub 范式
- [x] 启用两个单文件阈值

### 第二期 Sprint 4：utils/modal.ts + components/Modal/index.ts

- [x] 20 用例（modalBootloader 8 + 6 个 showXxxModal helper 12）
- [x] 验证 `vi.mock('vue', { createApp })` 必须默认委派 actual（不能返回 undefined）
- [x] 启用两个单文件阈值

### 第二期 Sprint 5：composables/useBookmarkRelative.ts

- [x] 24 用例（4 type guard + showFeedbackView + useLogBookmark + 2 composable）
- [x] 验证 `vi.spyOn(useNuxtApp().$i18n, 'setLocale')` 局部 spy 替代 mock useNuxtApp
- [x] 启用单文件阈值

### 第二期 Sprint 6.1：utils 4 个轻量文件

- [x] 22 用例（userRelative 1 + zip 5 + channel 9 + analytics 7）
- [x] 验证 `vi.stubGlobal` 必须在 beforeEach 内（不能放顶层）
- [x] 验证 `vi.resetModules` 不清 window listener → spy 拦 addEventListener 直接调 handler
- [x] pwa.ts 推迟第三期（useNuxtApp().$pwa configurable=false）
- [x] 启用 4 个单文件阈值

### 第二期 Sprint 6.2：utils/chatbot.ts（ChatBot class，PLAN P0）

- [x] 27 用例（constructor 3 + createMessages 5 + handleData 13 + 边界 6）
- [x] 验证真实 SSEDecoder/LineDecoder 直接 import 不 mock（避免 stub 假阳性）
- [x] 验证 chat() async resolve 时机是 subscriber 注册不是 done 完成
- [x] 启用单文件阈值

### 第二期收尾

- [x] 启用 `utils/**` 目录级阈值 90/85/90/90（pwa.ts exclude）
- [x] 修复根 `pnpm test` 占位符（改为代理 dweb）
- [x] 删除 `request.ts` 中遗留的 `console.log(error)` 调试日志

---

## 三、每一步做了什么（按时间顺序）

### 第一期（2026-05-22 ~ 2026-05-23）

**阶段 0：需求分析与方案设计**

- 通过 brainstorming skill 与用户交互 4 轮，确定：风险驱动分层覆盖、三层测试（unit + component + integration）、全 mock 边界、v8 coverage 分层门槛、方案 A（扁平 tests/ 镜像源码）
- 写 PLAN.md 设计文档，经过 8 轮审计（含 codex review 前身的人工审计）修订 18 处问题
- 通过 writing-plans skill 产出 PHASE1.md 施工计划

**阶段 1：基础设施搭建（Task 1-7）**

- 安装 @vitest/coverage-v8
- 建目录骨架 + README
- 写 setup 五件套（globalMocks / i18n / pinia / mount / index）
- 写 user.ts fixture（UserInfo 6 字段）
- 写 request.ts mock（vi.hoisted + 7 个链式方法桩）
- 更新 vitest.config.ts（setupFiles + v8 coverage + 单文件阈值）
- 更新 package.json scripts

**阶段 2：5 类样板用例（Task 8-12）**

- string.spec.ts：urlBase64ToUint8Array 5 用例，100% 覆盖
- useAuth.spec.ts：4 个方法副作用 8 用例，100% 覆盖
- BookmarkPanel.spec.ts：行为驱动重写 12 用例（含 FEEDBACK 容器选择器、types=[] 边界）
- integration/app.spec.ts：homepage CTA 渲染 + 跳转 2 用例

**阶段 3：第一期验收**

- 49 用例全过（含 theme 系列原有 22 个）
- string.ts 100/100/100/100、useAuth.ts 100/100/100/100
- pnpm dev 冒烟通过

### 第二期（2026-05-23 ~ 2026-05-24）

**Sprint 1：utils/request.ts（2026-05-23）**

- 4 个 task 串行（spec 骨架 + 客户端 + 服务端 + 启用阈值）
- 关键突破：vi.doMock + vi.resetModules 真切换 isServer（happy-dom 下 typeof window 仍 truthy，但 doMock 覆盖了模块级常量）
- 23 用例，全量 49 → 72

**Sprint 2.1 + 2.2：stores/user.ts（2026-05-23 ~ 2026-05-24）**

- 拆两个 sub-sprint：纯逻辑（getter + 本地 action）+ request 类 + 复合 action
- 关键发现：useNuxtApp 不能 mock（破坏 setupNuxt），改用 vi.spyOn 局部替换
- 关键发现：fire-and-forget .then 链路需 await Promise.resolve() flush microtask
- 54 用例，全量 72 → 126

**Sprint 3：environment.ts + DwebEnvironmentAdapter.ts（2026-05-23）**

- 首次使用 codex-review-loop.sh（4 轮 codex review，7 条意见全成立）
- 19 用例，全量 126 → 145

**Sprint 4：utils/modal.ts + Modal/index.ts（2026-05-24）**

- 关键发现：vi.mock('vue', { createApp: vi.fn() }) 破坏 setupNuxt，改用 actualCreateAppRef 委派
- 3 轮 codex review，5 条意见全成立
- 20 用例，全量 145 → 165

**Sprint 5：composables/useBookmarkRelative.ts（2026-05-24）**

- 关键发现：BookmarkDetail.starred/archived 是字符串字面量不是 boolean
- 3 轮 codex review，4 条意见全成立
- 24 用例，全量 165 → 189

**Sprint 6.1：4 个轻量 utils（2026-05-24）**

- 关键发现：vi.stubGlobal 必须在 beforeEach 内；vi.resetModules 不清 window listener
- 关键发现：pwa.ts 的 $pwa configurable=false 不能 mock → 推迟第三期
- 6 轮 codex review，12 条意见全成立（创纪录）
- 22 用例，全量 189 → 211

**Sprint 6.2：utils/chatbot.ts ChatBot class（2026-05-24）**

- 关键发现：SSEDecoder stub 假阳性 → 直接用真实 decoder
- 关键发现：chat() async resolve 时机是 subscriber 注册不是 done 完成
- 5 轮 codex review，13 条意见全成立
- 27 用例，全量 211 → 238

**第二期收尾（2026-05-24）**

- 启用 utils/\*\* 目录级阈值 90/85/90/90（pwa.ts exclude）
- 修复根 pnpm test 占位符
- 删除 request.ts 遗留 console.log

---

## 四、最终数据

### 用例数

| 阶段                    | 新增用例 | 累计全量 |
| ----------------------- | -------- | -------- |
| 第一期（含 theme 原有） | 49       | 49       |
| Sprint 1                | 23       | 72       |
| Sprint 2.1+2.2          | 54       | 126      |
| Sprint 3                | 19       | 145      |
| Sprint 4                | 20       | 165      |
| Sprint 5                | 24       | 189      |
| Sprint 6.1              | 22       | 211      |
| Sprint 6.2              | 27       | 238      |

### 覆盖率（已治理文件）

| 文件                                                            | lines     | branches  | functions | statements |
| --------------------------------------------------------------- | --------- | --------- | --------- | ---------- |
| utils/string.ts                                                 | 100       | 100       | 100       | 100        |
| utils/request.ts                                                | 100       | 93.33     | 100       | 100        |
| utils/environment.ts                                            | 100       | 94.44     | 100       | 100        |
| utils/modal.ts                                                  | 100       | 100       | 100       | 100        |
| utils/userRelative.ts                                           | 100       | 100       | 100       | 100        |
| utils/zip.ts                                                    | 100       | 80        | 100       | 100        |
| utils/channel.ts                                                | 100       | 87.5      | 100       | 100        |
| utils/analytics.ts                                              | 100       | 95.83     | 100       | 100        |
| utils/chatbot.ts                                                | 92.66     | 85.36     | 100       | 92.52      |
| stores/user.ts                                                  | 100       | 100       | 100       | 100        |
| composables/useAuth.ts                                          | 100       | 100       | 100       | 100        |
| composables/useBookmarkRelative.ts                              | 98.24     | 92        | 86.66     | 98.38      |
| components/Modal/index.ts                                       | 100       | 100       | 100       | 100        |
| components/Article/Selection/adapters/DwebEnvironmentAdapter.ts | 100       | 100       | 100       | 100        |
| **utils/** 目录级                                               | **96.93** | **88.64** | **100**   | **96.86**  |

### 阈值门槛

- 12 个单文件阈值（80/70/85/80）全部启用
- utils/\*\* 目录级阈值（90/85/90/90）启用
- pnpm test:coverage 退出码 0

### codex review 统计

| Sprint     | 轮数   | 意见数 | 成立   | 反驳  |
| ---------- | ------ | ------ | ------ | ----- |
| Sprint 3   | 4      | 7      | 7      | 0     |
| Sprint 4   | 3      | 5      | 5      | 0     |
| Sprint 5   | 3      | 4      | 4      | 0     |
| Sprint 6.1 | 6      | 12     | 12     | 0     |
| Sprint 6.2 | 5      | 13     | 13     | 0     |
| **合计**   | **21** | **41** | **41** | **0** |

---

## 五、关键技术沉淀

详见 `.claude/test-framework/lessons-learned.md`，共 18 条问题记录。核心约束摘要：

1. **Nuxt auto-import 必须用 mockNuxtImport**（vi.mock 路径拦不到）
2. **mockNuxtImport factory 内不能跨文件引用 spy**（TDZ 约束，必须同文件 vi.hoisted）
3. **不能 mock 整个 useNuxtApp**（破坏 setupNuxt，改用 vi.spyOn 局部替换）
4. **vi.mock('vue', { createApp }) 必须默认委派 actual**（setupNuxt 在加载时就调 createApp）
5. **vi.stubGlobal 必须在 beforeEach 内**（afterEach unstub 后顶层 stub 失效）
6. **vi.resetModules 不清 window listener**（累积问题，改用 spy 拦 addEventListener）
7. **SSE 协议必须双换行 \n\n**（SSEDecoder 收到空行才 emit，stub 容易假阳性）
8. **chat() async resolve 时机是 subscriber 注册**（done 副作用由 subscriber('', true) 同步触发）
9. **useRuntimeConfig mock 必须保留 app.baseURL**（router plugin 在 init 期读取）
10. **vi.fn(箭头函数) 不能 new**（构造函数 mock 用普通 function）

---

## 六、未完成项（推迟到第三期）

| 模块                                         | 原因                                                                | 推荐第三期方式                                     |
| -------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| utils/pwa.ts                                 | useNuxtApp().$pwa configurable=false 不能 mock                      | e2e（Playwright）或重构 pwaOpen 抽 getPwa() helper |
| composables/useBookmark.ts + useCommon.ts    | 组件级编排逻辑，mock 链路长、断言价值低                             | 真实组件挂载 + 行为断言                            |
| composables/useNotification.ts               | navigator.serviceWorker + Notification.requestPermission 浏览器 API | e2e                                                |
| components/Chat/ChatBot.vue                  | 965 行 Vue 组件，流式渲染                                           | 真实组件挂载 + 流式 mock                           |
| components/Notification/UserNotification.vue | firebase messaging + 13 边连接                                      | e2e                                                |
| composables/bookmark/useBookmark.ts          | 需要 bookmark fixture（拉后端反推）+ provider/inject 链             | 先做 bookmark fixture，再单元测                    |
| pages/bookmarks/index.vue 等                 | 400+ 行页面，需 renderSuspended                                     | integration 层                                     |

---

## 七、工具与流程沉淀

1. **codex-review-loop.sh**：把 `codex review` CLI 做成多轮交互循环，每轮落日志到 `.claude/test-framework/.codex-review-log/`。用法：`.claude/test-framework/codex-review-loop.sh <spec.md>`
2. **subagent-driven-development**：每个 task 派独立 subagent（haiku/sonnet/opus 按复杂度选），两阶段 review（spec compliance + code quality）
3. **spec 文档先行**：每个 sprint 先写 spec 文档 → codex review 多轮 → 通过后施工，避免施工时才暴露设计问题
4. **PLAN.md 验收点回填**：每个 sprint 完成后在 PLAN.md §9.x 勾选验收点，保持文档与代码同步
