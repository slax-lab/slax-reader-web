# SnapshotAIPanel 设计规范

> 编制日期：2026-05-29分支：`feature/snapshot-detail-redesign` 关联文档：[snapshot-refactor-plan.md](../../.claude/new-design/snapshot-refactor-plan.md)、[slax-reader-snapshot.md](../../.claude/new-design/slax-reader-snapshot.md) §5.1

---

## 一、背景与目标

详情页重构（Phase 4）完成后，AI 解析面板 slot 目前直接使用 `AISummaries.vue`，展示「全文解析（outline markdown）+ 思维导图」。

Snapshot 设计稿（§5.1）要求 AI 面板改为：

1. **全文概要**（overview 文本 + key takeaways 要点列表）
2. **全文解析**（outline，无思维导图）

`AISummaries` 在 dweb 中，`bookmarks/[id].vue` 和 `s/[id].vue` 是其 snapshot 详情页消费方（`w/[id].vue` 和 `sw/[id].vue` 仍在使用，不在本次范围内）。因此本次采用**完全重写**策略，新建 `SnapshotAIPanel.vue`，不在旧组件上缝补。

---

## 二、组件定位

| 项目     | 说明                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| 文件路径 | `apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotAIPanel.vue`           |
| 消费方   | `pages/bookmarks/[id].vue` 和 `pages/s/[id].vue` 的 `#ai` slot                            |
| 替换目标 | `AISummaries.vue`（dweb 版）在两个详情页的使用                                            |
| 不影响   | `apps/slax-reader-extensions/src/components/AISummaries.vue`（extensions 独立版本，不动） |

---

## 三、布局结构

```
┌─────────────────────────────────────┐
│  全文概要                            │  ← .panel-overview-label（13px / accent / weight 500）
│                                     │
│  overview 正文（14px / 1.8）         │  ← .panel-overview-text（MarkdownText 渲染）
│                                     │
│  ○ key takeaway 1                   │  ← .panel-keypoints 列表
│  ○ key takeaway 2                   │     每条 14px / text-muted
│  ○ key takeaway 3                   │     前缀：4px 直径、1.5px accent 空心圆圈
│                                     │
├─────────────────────────────────────┤  ← 1px border 分隔线
│                                     │
│  全文解析                            │  ← .panel-outline-header（13px / accent / weight 500）
│                                     │
│  § 1  Section Title                 │  ← .panel-section-title（Playfair 18px / weight 500）
│    · outline item                   │  ← .panel-outline-item（14px / text）
│    · outline item                   │     子项 14px / text-muted + 4px 实心点
│  § 2  Section Title                 │     序号 chip：11px / accent 字 + accent-bg 底 + 3px 圆角
│    · outline item                   │
└─────────────────────────────────────┘
```

---

## 四、数据流设计

两段内容**独立加载，互不阻塞**：

### 4.1 全文概要（overview）

| 项目 | 说明 |
| --- | --- |
| 接口 | `RESTMethodPath.BOOKMARK_OVERVIEW`（POST 流式） |
| 请求体 | `{ bookmark_id?, share_code?, force: false }`（两个页面分别传对应字段，后端待同步） |
| 触发时机 | `isAppeared` 变为 `true` 且 overview 尚未加载时自动触发 |
| 流式数据类型 | `overview`（**覆盖**最新值，非追加；参考 `AIOverview.vue:284` `overviewContent.value = responseData.content`）、`key_takeaways`（数组整体替换）、`tags`/`tag`（忽略，不处理） |
| 重试逻辑 | 加载完成后 `overviewContent` 仍为空 → 自动重试一次（`haveReconnected` 防止无限循环） |

流式 JSON 解析复用 `AIOverview` 中的 `parseConcatenatedJson` 逻辑（内联到组件，不抽公共函数）。

### 4.2 全文解析（outline）

| 项目     | 说明                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| 接口     | `BOOKMARK_AI_SUMMARIES_LIST`（GET）+ `BOOKMARK_AI_SUMMARIES`（POST 流式）          |
| 触发时机 | `isAppeared` 变为 `true` 且 outline 尚未加载时**自动触发**（与 overview 同步加载） |
| 加载策略 | 先 GET 列表，有缓存直接展示；无缓存则 POST 流式生成                                |
| 文本处理 | `extractMarkdownFromText`（`@commons/utils/parse`）处理流式文本                    |

**不实现**：anchor 跳转、多版本切换（`summaries` 列表切换）、思维导图、折叠/展开交互。

---

## 五、状态机

### 5.1 overview 状态

```
idle
  ↓ isAppeared = true
loading（骨架占位：3 行渐变条）
  ↓ 流式数据到达
streaming（逐步显示文本 + DotLoading）
  ↓ done = true
done（完整内容）
  ↓ overviewContent 为空
error（重试按钮）
```

### 5.2 outline 状态

```
idle
  ↓ isAppeared = true
loading（骨架占位）
  ↓ 数据到达
streaming（MarkdownText 渲染 + DotLoading）
  ↓ done = true
done（完整章节列表）
  ↓ 加载失败
error（重试按钮）
```

outline 与 overview 同步自动加载，无折叠/展开交互。

---

## 六、Props / Emits

```ts
// Props
props: {
  bookmarkId?: number      // bookmarks/[id].vue 传入
  shareCode?: string       // s/[id].vue 传入
  isAppeared?: boolean     // 面板是否可见（驱动自动加载）
}

// Emits
emits: ['dismiss']         // 关闭按钮点击，父层执行 activePanel = null
```

`contentSelector` 不需要（新组件不做 anchor 跳转到正文）。

---

## 七、复用清单

| 复用项                       | 来源                                   | 用途                    |
| ---------------------------- | -------------------------------------- | ----------------------- |
| `MarkdownText`               | `components/Markdown/MarkdownText.vue` | 渲染 outline markdown   |
| `DotLoading`                 | `components/DotLoading.vue`            | 流式加载光标动画        |
| `extractMarkdownFromText`    | `@commons/utils/parse`                 | 处理 outline 流式文本   |
| `parseConcatenatedJson` 逻辑 | 内联（参考 `AIOverview.vue`）          | 解析 overview 流式 JSON |
| `RESTMethodPath`             | `@commons/types/const`                 | 接口路径常量            |
| `request()` composable       | dweb 全局                              | HTTP 请求               |
| `--slax-*` token             | `theme.tokens.css`                     | 颜色、字号、间距        |

**不复用**：`AISummaries`、`AIOverview`、`MarkMindMap`、anchor 跳转逻辑、多版本切换逻辑、`CopyButton`（本期不做复制功能）。

---

## 八、样式规范（对齐 snapshot §5.1）

| 元素                     | 规范                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `.panel-overview-label`  | 13px / weight 500 / `var(--slax-accent)`                                              |
| `.panel-overview-text`   | 14px / line-height 1.8 / `var(--slax-text)`                                           |
| `.panel-keypoints` 每条  | 14px / `var(--slax-text-muted)`；前缀 4px 直径、1.5px `var(--slax-accent)` 空心圆圈   |
| 分隔线                   | 1px solid `var(--slax-border)`                                                        |
| `.panel-outline-header`  | 13px / weight 500 / `var(--slax-accent)`                                              |
| `.panel-section-title`   | Playfair 18px / weight 500 / `var(--slax-text)`                                       |
| `.panel-outline-item`    | 14px / `var(--slax-text)`；子项 14px / `var(--slax-text-muted)` + 4px 实心点          |
| 序号 chip                | 11px / `var(--slax-accent)` 字 + `var(--slax-accent-bg)` 底 + 3px 圆角                |
| 骨架占位 `.skeleton-row` | 渐变条 `from-#f5f5f3 to-#f5f5f399 dark:(from-#ffffff33 to-#ffffff11)` + animate-pulse |
| 容器 padding             | `px-20px py-24px`                                                                     |

---

## 九、与现有代码的衔接

### 9.1 两个详情页 AI slot 改动

**`pages/bookmarks/[id].vue`**（第 61-69 行）：

```vue
<!-- 改前 -->
<AISummaries
  v-if="bmId"
  :bookmarkId="bmId"
  :is-appeared="activePanel === 'ai'"
  :content-selector="'.bookmark-detail .detail'"
  @navigated-text="navigateToText"
  @dismiss="activePanel = null"
/>

<!-- 改后 -->
<SnapshotAIPanel v-if="bmId" :bookmark-id="bmId" :is-appeared="activePanel === 'ai'" @dismiss="activePanel = null" />
```

**`pages/s/[id].vue`**（第 66-73 行）：

```vue
<!-- 改前 -->
<AISummaries
  :share-code="shareCode"
  :is-appeared="activePanel === 'ai'"
  :content-selector="'.bookmark-detail .detail'"
  @navigated-text="navigateToText"
  @dismiss="activePanel = null"
/>

<!-- 改后 -->
<SnapshotAIPanel :share-code="shareCode" :is-appeared="activePanel === 'ai'" @dismiss="activePanel = null" />
```

两个页面同步删除 `AISummaries` 的 import 语句。

`navigateToText` 函数在 `useBookmark.ts:92-96` 的实现为 `summariesExpanded.value = false`。但 `tests/unit/composables/bookmark/useBookmark.spec.ts:147,325-330` 仍断言 `navigateToText` 存在且小屏行为正确，**不能直接删除**。处置方案：

- `useBookmark.ts` 中 `navigateToText` 保留函数签名，函数体改为空（`summariesExpanded` 已删，小屏逻辑已无意义）
- `useBookmark.spec.ts:C19` 用例改为断言 `navigateToText` 可调用且不抛错（不再断言 `summariesExpanded` 状态）
- 两个详情页的 `@navigated-text="navigateToText"` 绑定随 `AISummaries` 替换一并删除

### 9.2 AISummaries 消费方说明

`AISummaries.vue`（dweb 版）在本次改动后，`bookmarks/[id].vue` 和 `s/[id].vue` 不再引用，但 **`pages/w/[id].vue` 和 `pages/sw/[id].vue` 仍在使用**（已确认：`w/[id].vue:42`、`sw/[id].vue:42`）。因此本 PR **不删除、不标记待删除** `AISummaries.vue`，仅移除 snapshot 详情页的消费方。

---

## 十、测试计划

### 10.1 新增单元测试

文件：`tests/unit/components/SnapshotAIPanel.spec.ts`

**Mock 链路规范**（参考 `AISummaries.spec.ts` 范式）：

```ts
// request 是 nuxt auto-import，必须用 mockNuxtImport 拦截
const { mockGet, mockStream, mockRequest } = vi.hoisted(() => { ... })
mockNuxtImport('request', () => mockRequest)

// 每个用例前 reset
beforeEach(() => {
  mockGet.mockReset()
  mockStream.mockReset()
})
```

overview 区域容器选择器：`.panel-overview`；outline 区域容器选择器：`.panel-outline`。骨架和重试按钮在各自容器内查找，避免两区域互相满足断言。

**mockStream 断言隔离原则**：overview 和 outline 都走 `request().stream`，断言时必须按 url 过滤：

```ts
// 过滤 overview 调用
const overviewCalls = mockStream.mock.calls.filter(c => c[0].url === RESTMethodPath.BOOKMARK_OVERVIEW)
// 过滤 outline 调用
const outlineCalls = mockStream.mock.calls.filter(c => c[0].url === RESTMethodPath.BOOKMARK_AI_SUMMARIES)
```

overview 重试用例中，让 `mockGet` 返回非空缓存以隔离 outline stream 链路，避免 outline 的 stream 调用干扰 overview 重试计数。

| 用例                                                             | 验证点                                                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `isAppeared=false` 时不触发任何加载                              | `mockStream` 和 `mockGet` 均未被调用                                                                        |
| `isAppeared=true` 时 overview 和 outline **并发**启动（非阻塞）  | 让 overview stream 保持 pending，立即断言 `mockGet`（outline list）已被调用                                 |
| `isAppeared=true` 时自动触发 overview 加载                       | 按 url 过滤后，`BOOKMARK_OVERVIEW` stream 调用存在                                                          |
| `isAppeared=true` 时自动触发 outline 加载                        | `mockGet` 以 `BOOKMARK_AI_SUMMARIES_LIST` url 调用，且 `bookmarkId` 模式下 query 含 `{ bookmark_id: bmId }` |
| overview 加载中显示骨架                                          | `.panel-overview .skeleton-row` 存在                                                                        |
| overview 加载完成显示内容（覆盖语义）                            | 流式回调两次传入不同 overview 值，`.panel-overview-text` 最终显示最后一次值（非拼接）                       |
| overview 加载完成但内容为空 → 自动重试一次（outline 用缓存隔离） | 按 url 过滤，`BOOKMARK_OVERVIEW` stream 被调用两次                                                          |
| overview 重试后仍为空 → 显示重试按钮，不再自动重试               | `.panel-overview .retry-btn` 存在，`BOOKMARK_OVERVIEW` stream 共调用两次                                    |
| key takeaways 正确渲染                                           | `.panel-keypoints` 子项数量与数据一致                                                                       |
| outline 加载中显示骨架                                           | `.panel-outline .skeleton-row` 存在                                                                         |
| outline 缓存命中 → 直接展示，不触发 stream                       | `mockGet` 返回非空 summary，`MarkdownText` 渲染该内容，`BOOKMARK_AI_SUMMARIES` stream **未**被调用          |
| outline 空缓存后触发 stream 生成                                 | `mockGet` 返回空列表后，`BOOKMARK_AI_SUMMARIES` stream 以 POST method、`{ bm_id }` body 调用                |
| outline 加载完成显示 MarkdownText                                | `MarkdownText` stub 存在于 `.panel-outline` 内且 text prop 正确                                             |
| 点击关闭按钮触发 `dismiss` emit                                  | emit 被触发                                                                                                 |
| `bookmarkId` 正确传入 overview 请求体                            | 按 url 过滤后，`BOOKMARK_OVERVIEW` stream 调用参数 body 含 `{ bookmark_id: bmId }`                          |
| `shareCode` 正确传入 overview 请求体                             | 按 url 过滤后，`BOOKMARK_OVERVIEW` stream 调用参数 body 含 `{ share_code: shareCode }`                      |
| `shareCode` 正确传入 outline GET 请求                            | `mockGet` 调用参数 query 含 `{ share_code: shareCode }`                                                     |
| `shareCode` 模式 outline 空缓存后 stream body 含 share_code      | `BOOKMARK_AI_SUMMARIES` stream 调用参数 body 含 `{ share_code: shareCode }`（不是 `bm_id`）                 |
| overview stream 返回 `{ type: 'error' }` → 显示重试按钮          | `.panel-overview .retry-btn` 存在，loading 不卡住（`overviewLoading` 为 false）                             |
| overview stream reject（网络错误）→ 显示重试按钮                 | `mockStream` 以 `BOOKMARK_OVERVIEW` reject，`.panel-overview .retry-btn` 存在，loading 不卡住               |
| outline GET reject（网络错误）→ 显示重试按钮                     | `mockGet` reject，`.panel-outline .retry-btn` 存在，loading 不卡住                                          |
| `useBookmark.spec.ts:C19` 更新                                   | `navigateToText` 可调用且不抛错（不再断言 `summariesExpanded` 状态）                                        |

### 10.1.1 集成测试更新

`tests/integration/pages/bookmarks/[id].spec.ts` 中涉及 AI 面板的用例（含 C25 切换到 ai tab）需同步更新：

- 将 `AISummaries` stub 改为 `SnapshotAIPanel` stub
- `mockRequest` 需同时暴露 `get`（拦截 `BOOKMARK_AI_SUMMARIES_LIST`）和 `stream`（拦截 `BOOKMARK_OVERVIEW` 和 `BOOKMARK_AI_SUMMARIES`），避免挂载真实组件时触发缺失的请求链路或 `stream is not a function` 报错

### 10.2 手验场景

1. 打开 AI 面板 → overview 和 outline 同步骨架 → 内容逐步出现 → key takeaways 列表 + 章节列表
2. 切换到其他 tab 再切回 → overview/outline 状态保留（`v-show` 不重建）
3. 网络失败场景 → 重试按钮出现 → 点击重试重新加载
4. `s/[id].vue` 公共分享页（`shareCode` 模式）正常加载 overview 和 outline

---

## 十一、范围排除

- **不实现** anchor 跳转到正文（`@navigated-text`）
- **不实现** 多版本 outline 切换（`summaries` 列表）
- **不实现** 复制按钮（`CopyButton`）
- **不实现** 思维导图（`MarkMindMap`）
- **不删除** `AISummaries.vue`（dweb 版），本 PR 仅移除其消费方

---

## 十二、风险与对策

| 风险 | 对策 |
| --- | --- |
| overview 接口（`BOOKMARK_OVERVIEW`）在 dweb 的 `RESTMethodPath` 中是否已定义 | 施工前 grep 确认；若缺失则在 `@commons/types/const` 补充 |
| `BOOKMARK_OVERVIEW` 接口目前只接受 `bookmark_id`，`s/[id].vue` 传 `shareCode` | 前端请求体同时支持 `{ bookmark_id?, share_code?, force }` 两种入参；后端接口待同步支持 `share_code` 字段 |
| `parseConcatenatedJson` 内联后与 `AIOverview` 行为不一致 | 直接复制 `AIOverview.vue` 中的实现，不做改动 |
| outline 流式文本 `extractMarkdownFromText` 处理后为空 | 与 `AISummaries` 现有行为一致，显示「点击解析」空态 |
| `SnapshotSidePanel` 用 `v-show` 保留 slot 状态，切 tab 时 `isAppeared` 变化 | `isAppeared` 由父层传入 `activePanel === 'ai'`，`v-show` 不卸载组件，watch 逻辑正确响应 |
