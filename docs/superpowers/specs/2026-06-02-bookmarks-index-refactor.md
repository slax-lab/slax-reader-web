# bookmarks/index.vue 解耦重构规格

日期：2026-06-02分支：feature/snapshot-detail-redesign目标文件：`apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue`（当前 883 行）

## 目标

将书签列表页这个"上帝组件"按职责边界拆分为 composable + 子组件 + 常量文件，让页面只承担"编排"职责。重构后 `index.vue` 预计降到 ~150 行，且每个阶段独立可编译、可回滚。

**非目标（明确不做）：**

- 不改变任何用户可见行为（视觉、交互、数据流时序）——这是一次纯结构重构（阶段一~三）
- 不新增/恢复任何安全控制（遵循项目准则）
- 不重写 `BookmarkCell` / `TabsSidebar` / `BookmarksLayout` 等已抽离的子组件内部逻辑
- 不引入新的状态管理库（不上 Pinia store，列表状态是页面级而非全局）

## 现状职责分析

当前文件混杂 8 类职责：

| # | 职责 | 现有代码位置 | 行数估算 |
| --- | --- | --- | --- |
| 1 | 列表数据 + 分页 + 查询 | `bookmarks/highlights/notifications` ref、`queryBookmarks/Highlights/Notifications`、`loadData`、`onLoadMore`、`resetBookmarks`、`checkMore` | ~120 |
| 2 | 无限滚动 | `useScroll`、`useInfiniteScroll`、`canLoadMoreList`、`resetInfiniteScroll`、resize 监听 | ~25 |
| 3 | 筛选 + 路由同步 + 导航 | `filterStatus/Topic*/Collection*` refs、`selectTopic`、`selectCollection`、`inboxClick`、两个 `watch(route.query.filter)` / `watch(filterStatus)` | ~90 |
| 4 | 频道消息同步 | `chanelMessageHandler`、`onMounted/onUnmounted` 注册注销 | ~50 |
| 5 | 派生展示数据 | `groupedBookmarks`、`emptyViewConfig`、`lastUpdatedText`、`showList`、`isDataEmpty`、`isInTrash`、`isCurrentInboxTab`、`isRefreshLoading` | ~110 |
| 6 | 列表项变更 handlers | `handleCellArchive`、`handleCellAliasTitle`、`handleCellBookmarkUpdate`、`handleDelete`、`transitionLeave` | ~35 |
| 7 | 布局模式持久化 | `listMode` ref + watch + localStorage | ~7 |
| 8 | 刷新指示器 + 埋点 | `showRefreshLoading`/`refreshInterval` 定时器、`addLog` | ~40 |

## 顺带修复的既有问题（重构中一并清理，但都被集成测试盯着，须同步改测）

1. **死导入**：[index.vue:140](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L140) `InstallExtensionTips` 已导入但模板从未使用 → 删除。**注意**：集成测试 **C7** 仍断言它"不渲染"（假阳性通过，因模板早已无此组件）→ 删导入时同步修正 C7，改为断言当前真实空态（`QuickStart` / `BookmarksEmptyView`）。
2. **拼写**：`chanelMessageHandler`（少一个 n）→ 重命名为 `channelMessageHandler`。集成测试 C14-C18 通过 channel 事件黑盒验证，**不**直接引用该函数名 → 重命名不影响测试。
3. **死代码**：`checkMore` [index.vue:601](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L601) 在模板和 script 中均无调用方 → 删除。**注意**：集成测试 **C28** 名义上测它，但实际走 `.empty .icon` click，当前模板无此元素 → `if(exists())` 跳过 → 断言为 `expect(true).toBe(true)` 空跑。删 `checkMore` 时一并清理/重写 C28。删前仍 grep 全仓确认无其他引用。

## 关键架构决策（已与用户确认）

### 决策1：筛选→重载数据流——采用「保守搬家」

**现状真实时序（已对照源码逐行核实，codex round-1 P2 纠正了我最初的错误描述）**：是两条**不同**的重载路径，**不是**统一的"手动 load + watcher 双轨"：

- **切 tab（`inboxClick`，[index.vue:577-599](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L577-L599)）**：`resetBookmarks()` → **直接赋值** `filterStatus.value = type` → 清零 topic/collection id → `navigateTo`。它**不调用** `onLoadMore`，而是靠 `watch(filterStatus)`（[index.vue:367-373](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L367-L373)）触发 `reloadList()`（= `resetBookmarks` + `onLoadMore`）来加载。
- **选 topic/collection（`selectTopic`/`selectCollection`）**：`filterStatus` 始终是 `'topics'`/`'collections'` **不变**，故 `watch(filterStatus)` **不触发** → 必须**手动** `resetBookmarks()` → 改 `filterTopicId`/`filterCollectionId` → `navigateTo` → `await onLoadMore()`。
- **去重守卫**：`watch(filterStatus)` 和 `watch(route.query.filter)`（[index.vue:355-365](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L355-L365)）都有 `value === oldValue` early-return，防止 navigateTo 后 route 变化再触发一次重载。

**本次决策**：**保守搬家**，逐字复刻上述两条路径的差异。`useBookmarkFilter` 只出纯状态 + `applyXxx` 导航 helper（改 ref + navigateTo）；编排 action 留页面（见接口详图）。**`selectTab` 绝不调 `onLoadMore`**（靠 `applyTab` 改 filterStatus → `watch(filterStatus)` 触发重载；若再手动 load 会双触发 → 重复 reset/load，这正是 codex round-1 警告的坑）。激进的"单一 watch 收敛"留作后续独立优化，不在本次范围。

### 决策2：布局持久化——保留手写实现，不替换为 VueUse useLocalStorage

抽到 `useListLayoutMode` 但**保留**原 `ref + watch + 手动 localStorage` 写法（含 SSR 守卫 `import.meta.client`）。理由：原实现已正确处理 SSR 首屏取值，换 `useLocalStorage` 需验证 SSR hydration 行为，不值得在本次引入额外变量。

### 决策3：三种列表渲染——合并为单个 `BookmarkListContent.vue`

bookmarks / highlights / notifications 三种列表共享"空态 + 底部加载状态 + TransitionGroup"外壳，合并到一个组件内用 `filterStatus` 分发，避免三份重复外壳。

## 目标产物清单

### Composables（新增 4 个，放 `composables/bookmark/` 子目录，对齐既有 `useBookmark.ts` 分组）

> **导入约定（codex round-1 P2 已纠正）**：本项目**不依赖** `composables/` 的 auto-import——连第一层 composable 也是**显式 import** 的（如 [index.vue:150](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L150) `import useNotification from '#layers/core/app/composables/useNotification'`），`composables/bookmark/*`（`useBookmark`/`useArticle` 等）的所有现有 consumer 也都是显式 `import ... from '#layers/core/app/composables/bookmark/useXxx'`。 **因此本次 4 个新 composable 全部用显式 import**，放 `composables/bookmark/` 子目录沿用既有分组。**不存在"auto-import 子目录是否覆盖"的阻塞项**（原 plan 的这一假设作废）。阶段一抽 `useListLayoutMode`/`useRefreshIndicator` 时即用显式 import，不会出现"阶段二才发现 auto-import 不生效"的问题。

| 文件 | 职责 | 对外接口（草案） |
| --- | --- | --- |
| `useListLayoutMode.ts` | 布局模式持久化（决策2） | `{ listMode: Ref<'card'\|'text'> }` |
| `useRefreshIndicator.ts` | 250ms 延迟刷新指示器 | 入参 `isRefreshLoading: Ref<boolean>`；返回 `{ showRefreshLoading: Ref<boolean> }`；内部 `watch` + `onUnmounted` 清 timer |
| `useBookmarkFilter.ts` | 筛选状态 ref + 路由读取 + 纯导航 helper（不碰列表数据、不碰 scrollY） | 见下方接口详图 |
| `useBookmarkData.ts` | 列表数据 + 分页 + 查询 + 无限滚动 + 派生计算 + cell handlers | 见下方接口详图 |

> 频道同步（职责4）**不单独抽 composable**。理由：`channelMessageHandler` 深度依赖 `bookmarks` ref、`filterStatus`、`reloadList` 三者，单抽会产生大量参数透传（高耦合反而更乱）。本次将其作为 `useBookmarkData` 内部的一个方法暴露 `registerChannelSync()`，由页面在 `onMounted` 调用。后续若证明可复用再独立。

### 接口详图

```ts
// useBookmarkFilter.ts —— 纯筛选状态 + 路由读取（无构造期依赖，避免与 data 成环）
// codex round-4 P1：三个 select action（selectTopic/selectCollection/selectTab）既改 filter、
//   又要调 data 的 resetBookmarks/onLoadMore、还碰页面级 scrollY/小屏滚动——它们是【编排动作】，
//   归属【页面编排层】，不放进 useBookmarkFilter（否则 filter↔data 构造循环依赖无解）。
// useBookmarkFilter 只出：纯 filter ref + 两个 computed + 「无副作用的纯导航」helper（只 navigateTo + 改 ref）。
//   页面在 action 里：先 data.resetBookmarks() → 调 filter 的纯导航 helper → 视情况 data.onLoadMore()。
export function useBookmarkFilter() {
  const route = useRoute()
  const filterStatus = ref(`${route.query.filter || 'inbox'}`)
  const filterTopicId = ref(Number(route.query.topic_id || ''))
  const filterTopicName = ref(`${route.query.topic_name || ''}`)
  const filterCollectionId = ref(Number(route.query.c_id || ''))
  const filterCollectionCode = ref(String(route.query.c_code || ''))
  const filterCollectionName = ref(String(route.query.c_name || ''))

  const isInTrash = computed(() => filterStatus.value === 'trashed')
  const isCurrentInboxTab = computed(() => filterStatus.value === 'inbox' || !filterStatus.value)

  // 纯导航 helper：只改 ref + navigateTo，不碰 data/scrollY（无副作用，可被页面 action 安全组合）
  function applyTopic(info): Promise<void> // 改 topic ref + navigateTo(replace:true)
  function applyCollection(info): Promise<void> // 改 collection ref + navigateTo(replace:true)
  function applyTab(type: string): Promise<void> // 改 filterStatus + 清零 topic/collection id + navigateTo(notifications=replace:false)

  return {
    filterStatus,
    filterTopicId,
    filterTopicName,
    filterCollectionId,
    filterCollectionCode,
    filterCollectionName,
    isInTrash,
    isCurrentInboxTab,
    applyTopic,
    applyCollection,
    applyTab
  }
}
```

> **编排动作归属（页面层，或可选抽顶层 `useBookmarkPage` 组合 composable）**：
>
> ```ts
> // 页面 setup（无环：先各自独立构造，再在 action 里组合）
> const filter = useBookmarkFilter()
> const searchText = ref(''), { y } = useScroll(window, ...)  // 页面持有 searchText + scrollY
> const data = useBookmarkData(filter, searchText)            // data 依赖 filter（单向）
>
> // 三个编排 action 留在页面（同时持有 filter + data + searchText + y，组合它们）：
> async function selectTopic(info) { data.resetBookmarks(); await filter.applyTopic(info); await data.onLoadMore() }
> async function selectCollection(info) { data.resetBookmarks(); await filter.applyCollection(info); await data.onLoadMore() }
> async function selectTab(type, index?) {
>   if (searchText.value) { searchText.value = ''; y.value = 0 }
>   if (type === filter.filterStatus.value) return
>   data.resetBookmarks(); await filter.applyTab(type)         // applyTab 改 filterStatus → watch 触发 reloadList
>   if (index !== undefined && layout小屏) tabsSidebar 滚动居中
> }
> ```
>
> 依赖方向单向：`useBookmarkData → useBookmarkFilter`（data 读 filter ref），页面 → 两者。**无循环、无构造期死锁、每阶段可编译。** `useScroll`/`y` 归页面（scrollY 是页面级，不进任何 composable）。

```ts
// useBookmarkData.ts —— 接收 filter + searchText，内部持有列表状态
// 注（codex round-1 P2）：showList 与无限滚动 gating 都依赖 searchText
//   —— showList（index.vue:319-331）在搜索时返回 false 隐藏列表
//   —— canLoadMoreList（index.vue:390）在 searchText 非空时阻止加载
// 故 searchText 必须作为 Ref 入参传入，不能留在页面（否则搜索态下列表仍渲染/加载）
export function useBookmarkData(filter: ReturnType<typeof useBookmarkFilter>, searchText: Ref<string>) {
  const bookmarks = ref<BookmarkItem[]>([])
  const highlights = ref<HighlightItem[]>([])
  const notifications = ref<UserNotificationMessageItem[]>([])
  const loading = ref(false), ending = ref(false), page = ref(1)
  const isTransitioning = ref(false), isFirstLoad = ref(true), isActivated = ref(true)

  // 查询 + 分页
  function queryBookmarks/queryHighlights/queryNotifications(): Promise<...>
  function loadData<T>(query): Promise<T | undefined>
  function onLoadMore(): Promise<void>
  function resetBookmarks(): void
  function reloadList(): void

  // 无限滚动：内含 useInfiniteScroll（驱动 onLoadMore）+ resize 监听 + reset
  // 注意（codex round-5 P2）：useScroll 的 y 不在此处——y 是页面级（selectTab 归零用），
  //   留在页面 setup。data 只需 useInfiniteScroll(window, onLoadMore, {canLoadMore})，
  //   canLoadMore 读 loading/ending/isActivated/searchText（searchText 是入参）。
  // data 暴露 reset（重置无限滚动），不暴露 y。
  function reset(): void

  // 派生计算
  const groupedBookmarks, isDataEmpty, showList, lastUpdatedText, isRefreshLoading

  // cell handlers
  function handleCellArchive/handleCellAliasTitle/handleCellBookmarkUpdate/handleDelete/transitionLeave

  // 频道同步（职责4，内聚在此）
  function registerChannelSync(): void   // onMounted 调，内部 addChannelMessageHandler
  function unregisterChannelSync(): void  // onUnmounted 调

  return { /* 全部 state + computed + actions */ }
}
```

### 子组件（新增 5 个，放 `components/BookmarkList/`）

| 文件 | 替换的模板区间 | props / emits |
| --- | --- | --- | --- | --- |
| `BookmarksContentHeader.vue` | content-header slot [index.vue:20-33](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L20-L33) | props: searchText, filterStatus, filterTopic*, filterCollection*；emits: back, search-status-update, select-tag, select-collect, code-update, notification-back |
| `ListLayoutSwitcher.vue` | 工具栏 [index.vue:36-55](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L36-L55) | props: lastUpdatedText；v-model: listMode。**注意（codex round-3 P2）**：工具栏根 `v-if` 依赖 `!searchText && !['highlights','notifications'].includes(filterStatus) && !(filterStatus==='topics' && !filterTopicId)`（[index.vue:36](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L36)）。**本 plan 选：guard 留在父级 `v-if` 包裹该组件**（组件本身只管渲染切换器，不承载显隐条件），避免把 searchText/filterStatus/filterTopicId 都灌进一个纯 UI 组件。 |
| `BookmarkListContent.vue` | 主列表三分支 [index.vue:57-89](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L57-L89) | props: filterStatus, groupedBookmarks, highlights, notifications, listMode, loading, filterCollectionCode；emits: cell 的 delete/archive-update/alias-title-update/bookmark-update、transition-leave |
| `BookmarksEmptyState.vue` | 空态 [index.vue:90-106](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L90-L106) | props: filterStatus, isCurrentInboxTab, isFirstLoad, emptyViewConfig |
| `ListBottomStatus.vue` | 底部状态 [index.vue:107-119](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L107-L119) | props: loading, ending, isRefreshLoading, isInTrash, **filterStatus, filterTopicId, filterCollectionId**（codex P2：line 107 的 `!((topics&&!topicId) |  | (collections&&!collectionId))`guard 必须保留，否则未选 topic/collection 时会错误显示 loading/末尾态而非空白选择态。组件内部复刻该 guard，或由父级`v-if` 包裹——本 plan 选组件内复刻，故需这三个输入） |

### 常量文件（新增 1 个）

- `apps/slax-reader-dweb/layers/core/app/constants/bookmarkEmptyConfig.ts`（新建 `constants/` 目录）
  - 把 `emptyViewConfig` [index.vue:271-317](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L271-L317) 的 7 个 tab 的 `iconPath` 抽成常量映射。
  - **i18n 处理**：`title`/`desc` 依赖 `t()`，不能放纯常量。方案：常量只存 `{ key: string; iconPath: string }`，title/desc 的 i18n key 在消费处用 `t()` 拼。即常量导出 `BOOKMARK_EMPTY_ICONS: Record<string, string>`（iconPath）+ 默认 fallback。`emptyViewConfig` computed 留在 `useBookmarkData` 或 `BookmarksEmptyState` 内，引用该常量。

## 阶段化实施路线（风险递增，每阶段独立可编译可回滚）

> **前置阶段零（补强空断言）见"验证策略"节——必须先做，是真 TDD 安全网的前提，单独 commit。**

### 阶段一（零风险·纯搬家，无行为变更）

1. 删死导入 `InstallExtensionTips`（同步修正过期用例 C7）。
2. 新建 `constants/bookmarkEmptyConfig.ts`，抽 iconPath 映射。
3. 抽 4 个纯 UI 子组件：`ListLayoutSwitcher`（guard 留父级 v-if）、`BookmarksEmptyState`、`ListBottomStatus`（含 topic/collection guard 输入）、`BookmarksContentHeader`。逐个抽、抽完即在 `index.vue` 替换并跑集成测试。
4. 抽 `useListLayoutMode` + `useRefreshIndicator`（两个无外部依赖的 composable，显式 import）。

**阶段一验证**：集成测试全绿 + `pnpm --filter @apps/slax-reader-dweb build` 通过 + 手动回归。

### 阶段二（中风险·筛选解耦）

1. 抽 `useBookmarkFilter`，迁移 6 个 filter ref + `isInTrash/isCurrentInboxTab` + 三个**纯导航 helper** `applyTopic/applyCollection/applyTab`（只改 ref + navigateTo，无 data/scrollY 副作用）。**显式 import**。
2. **三个编排 action `selectTopic/selectCollection/selectTab` 留在页面**（组合 filter.applyXxx + 页面内联的 reset/load + 页面 searchText/y）。阶段二 data 仍是页面内联逻辑，action 直接调页面内的 `resetBookmarks/onLoadMore`。**严格保留决策1 两条时序**：`selectTab` 调 `applyTab`（改 filterStatus）靠 watch 重载、`selectTopic/selectCollection` 调 `applyTopic/applyCollection`（filterStatus 不变）后手动 `await onLoadMore()`。
3. `watch(route.query.filter)`（含 `addLog`）和 `watch(filterStatus → reloadList)` 留页面（reloadList 阶段三才抽出）。

### 阶段三（核心风险·列表数据解耦）

1. 抽 `useBookmarkData(filter, searchText)`，迁移列表 state、查询、分页、无限滚动（含 `isActivated` + onActivated/onDeactivated）、派生 computed、cell handlers。内部用 `filter.filterStatus`（不解构，保响应性）。**单向依赖 filter，无环**。
2. 页面三个编排 action 改为组合 `data.resetBookmarks/data.onLoadMore` + `filter.applyXxx`（构造顺序 `filter → data → 页面 action`，全程无循环依赖，见接口详图的页面 setup 示例）。`scrollY`/`useScroll` 保留在页面。
3. 把 `watch(filterStatus → reloadList)`、`watch(route.query.filter)` 安置妥当，**逐字比对原时序**。
4. 抽 `BookmarkListContent.vue`（依赖 useBookmarkData 产物，故放最后）。
5. 频道同步 `registerChannelSync/unregisterChannelSync` 内聚进 `useBookmarkData`，页面 `onMounted/onUnmounted` 调用。
6. 清理死代码 `checkMore`（grep 全仓确认无引用后删，同步清理/重写空跑用例 C28）。

### 阶段四（收尾）

1. `index.vue` 最终形态：仅编排 + 少量纯 UI 状态（`isShowTopModal`、`searchText`、`isSearching`、`feedbackClick`、`showNotificationList`）。
2. **生命周期副作用归属（codex round-1 P2，必须全部分配，不能丢）**：
   - `userStore.getUserInfo({ refresh: true })`（[index.vue:411](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L411) setup 顶层调用）→ **留页面**（页面级初始化，与列表逻辑无关）。
   - `onMounted` 内 `addChannelMessageHandler` → 走 `useBookmarkData.registerChannelSync()`；`!isSafari() && useNotification().requestPushPermission()` → **留页面 onMounted**（推送权限是页面职责）；`addLog()` → 见第 3 点。
   - `onActivated → isActivated.value = true` / `onDeactivated → isActivated.value = false`（[index.vue:419-425](apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue#L419-L425)）：`isActivated` 是无限滚动 `canLoadMoreList` 的 gate（防止 keep-alive 失活页继续加载）→ **`isActivated` ref 随无限滚动一起进 `useBookmarkData`**，`useBookmarkData` 内部用 `onActivated/onDeactivated` 维护它（composable 内可用这两个生命周期钩子）。
   - `onUnmounted → removeChannelMessageHandler` → 走 `unregisterChannelSync()`。
3. `useHead` / `defineOptions({ name: 'bookmarks' })` → **留页面**。`addLog`（埋点，依赖 `filterStatus` + `watch(route.query.filter)`）→ **留页面**（依赖 route watch，且是页面级分析事件）。
4. 全量回归。

## 验证策略：现有集成测试是"半张"安全网，需先补强（codex round-2 P2 + round-3 P2）

> **关键事实（已实地核实）**：仓内存在 `apps/slax-reader-dweb/tests/integration/pages/bookmarks/index.spec.ts`，893 行、50 个用例全绿、单次 5.35s。**但其中 20 个用例（40%）是 `expect(true).toBe(true)` 空断言**（grep 确认行号：242/256/270/283/344/351/383/399/433/491/573/587/599/611/623/635/721/737/796/814）——它们 emit 了事件、触发了逻辑，却**从不断言结果**，"不抛错即过"。
>
> **受影响的关键用例（空跑，不设防）**：C3-C6（isInTrash/isDataEmpty 特殊路径）、C10-C11（刷新指示器定时器）、C14-C18 部分（channel handler archive/star 分支）、C22（ending）、**C29-C33（cell handlers：归档移除/别名/splice 替换/删除——本次重构的核心逻辑！）**。
>
> **结论**：这 50 个用例**看起来全绿、实则 40% 不设防**，直接当 TDD 安全网会放过回归（改坏 C29-C33 的 cell handler 逻辑测试照样绿）。空断言比没测试更危险——给虚假安全感。
>
> **真正覆盖了行为的用例**（约 30 个，有实质 expect）：C1/C2/C7/C8/C9/C12/C13/C19/C20/C21/C23/C24/C25/C26/C27/C34/C35/C36/C37 等——这些是可信的，重构后须保持绿。
>
> **测试是黑盒/行为型**（子组件 emit + DOM query + mock 断言，不摸 `vm` 内部成员），逻辑搬进 composable 不会让有效断言批量失效。这是利好。

### 阶段零（前置·补强空断言，本次重构的真正起点）

> 在动任何生产代码**之前**，先把上述 20 个空断言中**与重构相关的**补成真断言。此刻是对照**旧逻辑**写断言，确保断言本身正确（旧代码现在是对的）。补强后再开始搬代码，才是真 TDD 安全网。

1. **C29-C33（cell handlers，最高优先）**：补断言验证 `bookmarks` 数组的真实变化——C29 归档后该项被 filter 移除（`wrapper` 中对应 cell 消失或列表长度-1）、C30 fallback 改 archived、C31 alias_title 更新、C32 splice 替换后标题变、C33 删除后移除 + isTransitioning。通过 DOM（cell 数量/内容）或暴露的渲染结果断言，不依赖 vm 内部。
2. **C14-C18（channel 分支）**：补断言验证 archive/star/trashed 各分支后列表项的增删改。
3. **C3-C6、C10-C11、C22**：补断言验证 isInTrash 文案、空态渲染、刷新 spinner 出现/消失、ending 末尾态——能黑盒断言的补，纯内部状态的酌情。
4. 补强后跑测试确认仍全绿（此时断言才真正生效）。**这一步单独 commit**，与后续结构重构分离，便于区分"测试补强"和"重构"。

### 每阶段验证命令（必跑）

```bash
# 集成回归网（阶段零补强后，全绿才有意义）
pnpm --filter @apps/slax-reader-dweb test -- tests/integration/pages/bookmarks/index.spec.ts
# 阶段三新增 composable 单测
pnpm --filter @apps/slax-reader-dweb test -- tests/unit/composables/bookmark/useBookmarkData.spec.ts
```

### 施工前必处理的两个过期用例

- **C7**：断言 `InstallExtensionTips` 不渲染，但当前模板根本无此组件（仅死导入 + 测试 stub），靠"找不到→false→通过"**假阳性**。删死导入时同步修正 C7 改测真实空态（`QuickStart`/`BookmarksEmptyView`）。
- **C28**：走 `.empty .icon` click 触发 `checkMore`，当前空态无此元素 → `if(exists())` 跳过 → `expect(true).toBe(true)` 空跑。删 `checkMore` 时一并清理/重写 C28。

### 补测计划（阶段三）

抽 `useBookmarkData` 后补单元测试 `tests/unit/composables/bookmark/useBookmarkData.spec.ts`，覆盖 loadData 分页/ending、channel handler 全分支、cell handlers，与 `useBookmark.spec.ts` 范式一致。

### 手动回归（补充集成测试覆盖不到的视觉/交互）

集成测试覆盖逻辑分支，但以下视觉/真实浏览器行为仍需手动确认：

1. **切 tab**：inbox/starred/topics/highlights/archive/trashed/notifications 互切，列表正确重载、URL query 同步、小屏 tab 滚动到中间。
2. **选 topic**：选标签 → URL 带 `topic_id` → 列表加载；取消选择 → 回到话题空态。
3. **选 collection**：同上，URL 带 `c_id/c_name/c_code`。
4. **搜索**：输入搜索词进入搜索态（列表隐藏）→ 返回退出搜索。
5. **无限滚动**：滚到底加载下一页；到末尾显示"没有更多"（trash 显示专属文案）；窗口 resize 后 reset 正常。
6. **cell 变更同步**：归档/取消归档、收藏/取消收藏、删除、改别名后，列表项就地更新或移除，且不同 tab 下行为符合原 `handleCellArchive` 分支。
7. **跨标签页 channel 同步**：另开标签页归档/收藏/删除，本页通过 channel 增量同步（复刻 `channelMessageHandler` 全部分支）。
8. **刷新指示器**：首页加载（page===1）时 250ms 后顶部出现 spinner，加载完消失。
9. **布局模式**：card/text 切换，刷新页面后保持（localStorage）；text-mode 下卡片样式变化（`:has(.text-mode)` 间距）。
10. **空态**：inbox 空 + PC + 非首加载 → QuickStart；其他 tab 空 → BookmarksEmptyView + 对应 icon/文案。
11. **FAB + AddUrl**：点 FAB 弹 AddUrlTopModal，添加成功 toast + reload。
12. **埋点**：切 tab 触发 `bookmark_list_view`（section 映射正确）。

## 本地验证命令（已对照 package.json 核实，codex round-1 P3）

```bash
# 构建（dweb 包名 = @apps/slax-reader-dweb，script: "build": "nuxt build"）
pnpm --filter @apps/slax-reader-dweb build
# 或根目录快捷脚本：
pnpm build:dweb

# 测试（script: "test": "vitest run"）
pnpm --filter @apps/slax-reader-dweb test
# 或根目录：
pnpm test:dweb

# 单文件测试（阶段三新增 useBookmarkData 用例时）
pnpm --filter @apps/slax-reader-dweb test -- tests/unit/composables/bookmark/useBookmarkData.spec.ts

# lint（根目录）
pnpm lint
```

> **类型检查（codex round-2 P3 纠正）**：dweb 包和根包均无 `typecheck` script，且 nuxt.config **未启用** `typescript.typeCheck`，`nuxt build` 默认**不**跑独立 vue-tsc。`nuxi` 也不在 `node_modules/.bin`。**故没有现成的纯类型检查命令**。本次类型安全依赖：(1) IDE/volar 实时类型提示；(2) `vitest`（vue 组件挂载时会暴露大部分类型/运行时错误）；(3) ESLint。如需强类型门禁，可临时 `pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit`（vue-tsc 随 nuxt 间接安装，需先验证可执行），但不作为阶段必跑项。原 plan「build 内部覆盖类型检查」的说法作废。

## 回滚方案

- 每阶段一个 commit（或一组），出问题 `git revert` 单个阶段。
- composable 抽离若编译失败，保留原 `index.vue` 逻辑不删，先并行验证新 composable 再切换。
- 阶段三风险最高：先让 `useBookmarkData` 与原页面逻辑并存跑通，再删原内联逻辑。

## 施工时确认项

codex round-1 已解决（不再是未决项）：

- [x] composable 导入：本项目全显式 import，无 auto-import 阻塞 → 4 个新 composable 显式 import
- [x] monorepo 命令：`pnpm --filter @apps/slax-reader-dweb build` / `test`；无 typecheck script
- [x] tab/topic/collection 三条重载时序差异已厘清（决策1）
- [x] searchText 须传入 `useBookmarkData`；底部状态须带 topic/collection guard；生命周期副作用已全部分配

施工中仍需实地确认：

- [x] `useScroll(window)` SSR 守卫——已确认项目 `ssr: false`（测试日志 "SSR is disabled"），setup 顶层调 `useScroll(window)` 安全，无需额外 `import.meta.client` 守卫。**`useScroll`/`y` 留在页面 setup**（不进 composable）；`useBookmarkData` 只内含 `useInfiniteScroll`，不暴露 `y`。
- [ ] `checkMore` grep 全仓确认无引用后再删（连同空跑用例 C28）
- [ ] `useBookmarkData` 接收 `filter` 返回对象——解构会丢响应性，故内部通过 `filter.filterStatus`（保持 .value 访问）使用，不解构
- [x] selectTab 的 searchText/y/小屏滚动归属——**已定（codex round-4/5）**：三个编排 action 留**页面层**，`searchText`/`useScroll y` 由页面持有，action 直接读写；`useBookmarkFilter` 只出 `applyTab`（改 ref + navigateTo），**不接收任何 data/scroll 注入**。不存在"注入 useBookmarkFilter"一说。
