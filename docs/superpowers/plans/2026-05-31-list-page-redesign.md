# 列表页样式重构施工计划

> 编制日期：2026-05-31依据方案：`.claude/new-design/list-refactor-plan.md` 目标分支：`feature/snapshot-detail-redesign`

---

## 总览

将列表页从分裂式 header + 绝对定位侧边栏重构为：统一 56px 毛玻璃 topbar + sticky 240px 侧边栏 + main 三栏布局，并新增卡片化书签、日期分组、FAB 添加入口。

**涉及文件：**

- 修改：`layers/core/i18n/locales/zh.json`、`en.json`
- 重写：`components/Layouts/BookmarksLayout.vue`
- 新建：`components/BookmarkList/BookmarksTopBar.vue`（Phase 1 占位，Phase 2 完善）
- 新建：`components/BookmarkList/BookmarksSearchBar.vue`（Phase 2）
- 新建：`components/BookmarkList/BookmarksUserMenu.vue`（Phase 2）
- 重写：`components/BookmarkList/TabsSidebar.vue`（Phase 3）
- 重写：`components/BookmarkList/BookmarkCell.vue`（Phase 4）
- 新建：`components/BookmarkList/BookmarkDateGroup.vue`（Phase 4）
- 新建：`components/BookmarkList/BookmarksFab.vue`（Phase 5）
- 修改：`pages/bookmarks/index.vue`（Phase 2、4、5）
- 删除：`components/BookmarkList/SearchTopModal.vue`（Phase 5）
- 更新：`tests/unit/components/Layouts/BookmarksLayout.spec.ts`（Phase 1）

---

## Phase 0：i18n 文案

**目标：** 新增 8 个 i18n key，无视觉变化。

### Task 0.1：更新 zh.json

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/i18n/locales/zh.json`

- [ ] 在 `page.bookmarks_index` 对象末尾新增以下 8 个 key：

```json
"search_placeholder": "搜索文章…",
"search_history_title": "最近搜索",
"search_history_clear": "清空",
"search_back": "返回",
"layout_card": "卡片视图",
"layout_text": "文字视图",
"add_article": "添加文章",
"date_group_format": "{year} 年 {month} 月"
```

### Task 0.2：更新 en.json

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/i18n/locales/en.json`

- [ ] 在 `page.bookmarks_index` 对象末尾新增以下 8 个 key：

```json
"search_placeholder": "Search articles…",
"search_history_title": "Recent searches",
"search_history_clear": "Clear",
"search_back": "Back",
"layout_card": "Card view",
"layout_text": "Text view",
"add_article": "Add article",
"date_group_format": "{month} {year}"
```

### Task 0.3：验证 & commit

- [ ] 运行测试确认无报错：

  ```bash
  cd /Users/yjc/Documents/Company/slax-reader-web
  pnpm --filter @apps/slax-reader-dweb test --run
  ```

  预期：所有测试通过（i18n 文件变更不影响现有测试）

- [ ] git commit：
  ```
  feat(i18n): add list page redesign i18n keys for bookmarks_index
  ```

---

## Phase 1：BookmarksLayout 结构重写

**目标：** 重写布局为三栏结构（topbar + sidebar + main），新建 BookmarksTopBar 占位组件，更新测试。

### Task 1.1：新建 BookmarksTopBar.vue（占位）

- Files:
  - 新建：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarksTopBar.vue`

- [ ] 创建占位组件，结构与 SnapshotTopBar 一致，使用毛玻璃样式：

```vue
<template>
  <!-- 列表页顶栏：56px 毛玻璃，Phase 2 接入完整内容 -->
  <header class="bookmarks-topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <slot name="left" />
      </div>
      <div class="topbar-right">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.bookmarks-topbar {
  --style: fixed top-0 left-0 right-0 z-50;
  height: var(--slax-header-height);
  background: var(--slax-topbar-bg);
  backdrop-filter: var(--slax-blur);
  border-bottom: 1px solid var(--slax-border);

  @media (max-width: 768px) {
    height: var(--slax-header-h-mobile);
  }
}

.topbar-inner {
  --style: h-full max-w-shell mx-auto px-28px flex items-center justify-between;
}

.topbar-left {
  --style: flex items-center gap-12px;
}

.topbar-right {
  --style: flex items-center gap-16px;
}
</style>
```

### Task 1.2：重写 BookmarksLayout.vue

- Files:
  - 重写：`apps/slax-reader-dweb/layers/core/app/components/Layouts/BookmarksLayout.vue`

- [ ] 重写为三栏布局，保留 `isSmallScreen()` expose，废弃旧 slot（`#operates`、`#top-modals`、`#sidebar-right`），保留 `#sidebar-left`、`#content-header`、`#content-list`：

```vue
<template>
  <div class="bookmarks-layout">
    <!-- 移动端断点检测元素：opacity-1 时表示小屏，供 isSmallScreen() 判断 -->
    <div class="small-screen-trigger" ref="smallScreenTrigger"></div>

    <!-- 顶栏：固定定位，毛玻璃效果 -->
    <BookmarksTopBar>
      <template #left>
        <span class="topbar-logo">{{ $t('common.app.name') }}</span>
        <ClientOnly><ProIcon /></ClientOnly>
        <ClientOnly><ThemeSwitcher /></ClientOnly>
      </template>
    </BookmarksTopBar>

    <!-- 主体：顶部留出 header 高度，三栏布局 -->
    <div class="layout">
      <!-- 左侧导航：sticky，≤920px 隐藏 -->
      <aside class="sidebar">
        <slot name="sidebar-left" />
      </aside>

      <!-- 主内容区 -->
      <main class="main">
        <slot name="content-header" />
        <slot name="content-list" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 引入占位顶栏组件（Phase 2 会在 BookmarksTopBar 内部完善）
import BookmarksTopBar from '#layers/core/app/components/BookmarkList/BookmarksTopBar.vue'

const smallScreenTrigger = ref<HTMLDivElement>()

// 通过 CSS opacity 判断当前是否为小屏（移动端）
// 小屏时 .small-screen-trigger opacity 为 1，桌面端为 0
const isSmallScreen = () => {
  if (!smallScreenTrigger.value) {
    return false
  }
  const style = window.getComputedStyle(smallScreenTrigger.value)
  return style.opacity === '1'
}

defineExpose({
  isSmallScreen
})
</script>

<style lang="scss" scoped>
.bookmarks-layout {
  --style: w-full min-h-screen bg-surface-solid;
}

// 移动端断点检测：小屏时 opacity-1，桌面端 opacity-0
.small-screen-trigger {
  --style: 'h-0 bg-transparent max-md:(opacity-100) md:(opacity-0)';
}

// 顶栏 logo 文字
.topbar-logo {
  --style: font-serif font-500 text-brand text-accent;
}

// 主体三栏容器：顶部留出 header 高度
.layout {
  --style: max-w-shell mx-auto flex;
  padding-top: var(--slax-header-height);

  @media (max-width: 768px) {
    padding-top: var(--slax-header-h-mobile);
  }
}

// 左侧导航：sticky，≤920px 隐藏
.sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: var(--slax-header-height);
  height: calc(100vh - var(--slax-header-height));
  overflow-y: auto;

  @media (max-width: 920px) {
    display: none;
  }

  @media (max-width: 768px) {
    top: var(--slax-header-h-mobile);
    height: calc(100vh - var(--slax-header-h-mobile));
  }
}

// 主内容区：flex-1，内边距
.main {
  --style: flex-1 min-w-0;
  padding: 32px 40px 80px;

  @media (max-width: 920px) {
    padding: 24px 20px 80px;
  }

  @media (max-width: 768px) {
    padding: 16px 16px 80px;
  }
}
</style>
```

### Task 1.3：更新 BookmarksLayout.spec.ts

- Files:
  - 更新：`apps/slax-reader-dweb/tests/unit/components/Layouts/BookmarksLayout.spec.ts`

- [ ] 同步测试：移除废弃 slot 测试（`operates`、`top-modals`、`sidebar-right`），更新结构断言，保留 `isSmallScreen()` 测试：

```typescript
// Layouts/BookmarksLayout 组件单测
// 新结构：BookmarksTopBar + sticky sidebar + main 三栏布局
// 保留 slot：sidebar-left、content-header、content-list
// expose: isSmallScreen() 基于 smallScreenTrigger.opacity
import BookmarksLayout from '~~/layers/core/app/components/Layouts/BookmarksLayout.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('Layouts/BookmarksLayout', () => {
  it('mount → 渲染 .bookmarks-layout + .layout + .sidebar + .main', () => {
    const wrapper = mountWithApp(BookmarksLayout)
    expect(wrapper.find('.bookmarks-layout').exists()).toBe(true)
    expect(wrapper.find('.layout').exists()).toBe(true)
    expect(wrapper.find('.sidebar').exists()).toBe(true)
    expect(wrapper.find('.main').exists()).toBe(true)
  })

  it('具名 slot sidebar-left 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: { 'sidebar-left': '<div class="custom-left">L</div>' }
    })
    expect(wrapper.find('.custom-left').exists()).toBe(true)
  })

  it('具名 slot content-header / content-list 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: {
        'content-header': '<div class="custom-header">H</div>',
        'content-list': '<div class="custom-list">List</div>'
      }
    })
    expect(wrapper.find('.custom-header').exists()).toBe(true)
    expect(wrapper.find('.custom-list').exists()).toBe(true)
  })

  it('暴露 isSmallScreen() 基于 trigger opacity（happy-dom 默认 opacity 不为 1）', () => {
    const wrapper = mountWithApp(BookmarksLayout)
    expect((wrapper.vm as any).isSmallScreen()).toBe(false)
  })
})
```

### Task 1.4：验证 & commit

- [ ] 运行测试：

  ```bash
  cd /Users/yjc/Documents/Company/slax-reader-web
  pnpm --filter @apps/slax-reader-dweb test --run
  ```

  预期：所有测试通过，BookmarksLayout.spec.ts 4 个用例全绿

- [ ] git commit：
  ```
  feat(list): rewrite BookmarksLayout to three-column layout with topbar placeholder
  ```

---

## Phase 2：顶栏组件（待执行）

**目标：** 完善 BookmarksTopBar，新建 BookmarksSearchBar 和 BookmarksUserMenu，更新 index.vue 搜索流程。

### Task 2.1：新建 BookmarksSearchBar.vue

- Files:
  - 新建：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarksSearchBar.vue`
- [ ] 实现搜索框 + localStorage 历史下拉（最多 5 条）
- [ ] focus 展开历史，回车 emit `search(keyword)`，Esc 收起
- [ ] 使用 `vOnClickOutside` 点击外部收起

### Task 2.2：新建 BookmarksUserMenu.vue

- Files:
  - 新建：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarksUserMenu.vue`
- [ ] 复用 `useExclusivePopover` + `vOnClickOutside`
- [ ] 含「个人信息」「反馈」「退出登录」三项
- [ ] 反馈项 emit `feedback`，由 index.vue 监听

### Task 2.3：完善 BookmarksTopBar.vue

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarksTopBar.vue`
- [ ] 接入 BookmarksSearchBar（≤860px 隐藏）
- [ ] 接入 UserNotification（保持现有组件）
- [ ] 接入 BookmarksUserMenu

### Task 2.4：更新 pages/bookmarks/index.vue

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue`
- [ ] 移除 `isShowSearchModal` ref 和 `SearchTopModal` import
- [ ] 新增 `@search` 事件绑定到 BookmarksSearchBar
- [ ] 移除 `v-slot:operates` 和 `v-slot:top-modals` template 块

### Task 2.5：验证 & commit

- [ ] 运行测试
- [ ] git commit: `feat(list): add BookmarksSearchBar, BookmarksUserMenu and wire up topbar`

---

## Phase 3：TabsSidebar 样式重设计（待执行）

**目标：** 从横向 tab 改为竖向 sidebar-item 列表，保留所有逻辑。

### Task 3.1：重写 TabsSidebar.vue 样式

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/TabsSidebar.vue`
- [ ] 竖向 sidebar-item 列表，激活态用 `accent` 色
- [ ] 移除图片 icon，改用 SVG inline icon
- [ ] 保留 `changeTab` emit 和 `getAllButtons` expose

### Task 3.2：验证 & commit

- [ ] 运行测试
- [ ] git commit: `feat(list): redesign TabsSidebar to vertical sticky sidebar`

---

## Phase 4：BookmarkCell 卡片化 + 日期分组（待执行）

**目标：** 书签卡片化，新增日期分组，支持卡片/文字双模式切换。

### Task 4.1：重写 BookmarkCell.vue 样式

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarkCell.vue`
- [ ] 毛玻璃卡片（`.article-card`）：标题 + 日期 + 来源胶囊 + hover 操作 + 星标
- [ ] hover 时 `translateY(-1px)` + 操作按钮 opacity 0→1
- [ ] 文字模式（`.text-mode`）：透明背景，底部边框分隔

### Task 4.2：新建 BookmarkDateGroup.vue

- Files:
  - 新建：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarkDateGroup.vue`
- [ ] 接收 `label` prop，渲染月份分组标题

### Task 4.3：更新 pages/bookmarks/index.vue

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue`
- [ ] 新增 `groupedBookmarks` computed（按月分组）
- [ ] 新增 `listMode: 'card' | 'text'`（localStorage 持久化）
- [ ] 新增布局切换器（page-toolbar）

### Task 4.4：验证 & commit

- [ ] 运行测试
- [ ] git commit: `feat(list): card-style BookmarkCell with date grouping and layout switcher`

---

## Phase 5：FAB + 收尾（待执行）

**目标：** 新增 FAB 替代右侧栏添加按钮，删除 SearchTopModal，全量测试。

### Task 5.1：新建 BookmarksFab.vue

- Files:
  - 新建：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/BookmarksFab.vue`
- [ ] 固定定位右下角，点击 emit `click`
- [ ] 宽屏（≥1256px）对齐 shell 右边缘

### Task 5.2：更新 pages/bookmarks/index.vue

- Files:
  - 修改：`apps/slax-reader-dweb/layers/core/app/pages/bookmarks/index.vue`
- [ ] 接入 BookmarksFab，点击触发 `isShowTopModal = true`
- [ ] 移除 `v-slot:sidebar-right` template 块

### Task 5.3：删除 SearchTopModal.vue

- Files:
  - 删除：`apps/slax-reader-dweb/layers/core/app/components/BookmarkList/SearchTopModal.vue`

### Task 5.4：全量测试 & commit

- [ ] 运行全量测试：
  ```bash
  cd /Users/yjc/Documents/Company/slax-reader-web
  pnpm --filter @apps/slax-reader-dweb test --run
  ```
  预期：所有测试通过
- [ ] git commit: `feat(list): add BookmarksFab, remove SearchTopModal, complete list redesign`
