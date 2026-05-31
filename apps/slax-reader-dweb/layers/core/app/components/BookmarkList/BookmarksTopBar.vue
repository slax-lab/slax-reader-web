<template>
  <!-- 列表页顶栏：56px 毛玻璃，自包含所有内容 -->
  <header class="bookmarks-topbar">
    <div class="topbar-inner">
      <!-- 左侧：品牌名 + Pro 标识 + 主题切换 -->
      <div class="topbar-left">
        <button class="topbar-logo" @click="navigateTo('/bookmarks')" type="button">
          {{ $t('common.app.name') }}
        </button>
        <ClientOnly><ProIcon /></ClientOnly>
        <ClientOnly><ThemeSwitcher /></ClientOnly>
      </div>

      <!-- 右侧：搜索框 + 通知 + 用户菜单 -->
      <div class="topbar-right">
        <BookmarksSearchBar @search="onSearch" />
        <UserNotification :icon-style="UserNotificationIconStyle.TINY" @checkAll="emit('checkAll')" />
        <BookmarksUserMenu @feedback="emit('feedback')" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import BookmarksSearchBar from '#layers/core/app/components/BookmarkList/BookmarksSearchBar.vue'
import BookmarksUserMenu from '#layers/core/app/components/BookmarkList/BookmarksUserMenu.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/app/components/Notification/UserNotification.vue'

const emit = defineEmits<{
  search: [keyword: string]
  feedback: []
  checkAll: []
}>()

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

.topbar-logo {
  // 品牌名：衬线字体 + 强调色，点击回到列表首页
  --style: font-serif font-500 text-brand text-accent cursor-pointer bg-transparent border-none p-0;
}

.topbar-right {
  --style: flex items-center gap-16px;
}
</style>
