<template>
  <!-- 列表页顶栏：56px 毛玻璃，自包含所有内容 -->
  <header class="bookmarks-topbar">
    <div class="topbar-inner">
      <!-- 左侧：侧栏折叠按钮 + 品牌名 + 主题切换 -->
      <div class="topbar-left">
        <!-- 折叠按钮：≤920px 侧栏本身隐藏或转为横条，按钮随之隐藏 -->
        <button class="topbar-menu" :title="menuLabel" :aria-label="menuLabel" :aria-expanded="!collapsed" @click="toggle" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button class="topbar-logo" @click="navigateTo('/bookmarks')" type="button">
          <img src="@images/icon-logo-bookmark.png" width="24" height="24" alt="Slax Reader" />
          {{ $t('common.app.name') }}
        </button>
        <ClientOnly><ThemeSwitcher /></ClientOnly>
      </div>

      <!-- 右侧：搜索框 + 通知 + 用户菜单 -->
      <div class="topbar-right">
        <BookmarksSearchBar @search="onSearch" />
        <UserNotification :icon-style="UserNotificationIconStyle.TINY" @checkAll="emit('checkAll')">
          <template #icon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--slax-text-muted)">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </template>
        </UserNotification>
        <BookmarksUserMenu @feedback="emit('feedback')" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import BookmarksSearchBar from '#layers/core/app/components/BookmarkList/BookmarksSearchBar.vue'
import BookmarksUserMenu from '#layers/core/app/components/BookmarkList/BookmarksUserMenu.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/app/components/Notification/UserNotification.vue'

import { useSidebarCollapsed } from '#layers/core/app/composables/bookmark/useSidebarCollapsed'

const emit = defineEmits<{
  search: [keyword: string]
  feedback: []
  checkAll: []
}>()

const { t } = useI18n()
const { collapsed, toggle } = useSidebarCollapsed()
const menuLabel = computed(() => (collapsed.value ? t('page.bookmarks_index.sidebar_expand') : t('page.bookmarks_index.sidebar_collapse')))

const onSearch = (keyword: string) => {
  emit('search', keyword)
}
</script>

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

// 折叠按钮：36px 圆形热区，与侧栏列同壳对齐
.topbar-menu {
  --style: flex-center size-36px rounded-full cursor-pointer bg-transparent border-none p-0;
  color: var(--slax-text-muted);
  transition:
    color var(--slax-dur-fast),
    background var(--slax-dur-fast);

  &:hover {
    color: var(--slax-text);
    background: var(--slax-accent-bg);
  }

  @media (max-width: 920px) {
    display: none;
  }
}

.topbar-logo {
  // 品牌名：衬线字体，demo 用 var(--text) 深色而非 accent 橙色
  --style: flex items-center gap-10px font-serif font-500 text-brand text-txt cursor-pointer bg-transparent border-none p-0;
  letter-spacing: -0.02em;

  img {
    flex-shrink: 0;
    display: block;
  }
}

.topbar-right {
  --style: flex items-center gap-16px;
}
</style>
