<template>
  <!-- 竖向导航侧边栏：替代原横向 tab 列表 -->
  <nav class="tabs-sidebar" ref="sidebarEl">
    <!-- 主导航项 -->
    <button v-for="(item, index) in tabList" :key="item.type" class="sidebar-item" :class="{ active: tabType === item.type }" @click="inboxClick(item.type, index)" type="button">
      <!-- inline SVG icon，不依赖图片文件 -->
      <svg class="item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" v-html="item.iconPath" />
      <span>{{ item.title }}</span>
    </button>

    <!-- 分隔线 -->
    <div class="sidebar-divider" />

    <!-- 废纸篓 -->
    <button class="sidebar-item" :class="{ active: tabType === 'trashed' }" @click="inboxClick('trashed')" type="button">
      <svg class="item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
      <span>{{ $t('page.bookmarks_index.Trash') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
// BookmarkTabTypes 和 TabIconPaths 由 Nuxt auto-import 注入
// 不显式 import，以便 fork 对 useBookmarkRelative 的 override 能通过 layer 优先级生效
const { t } = useI18n()
const sidebarEl = ref<HTMLElement>()

defineProps({
  tabType: {
    type: String,
    default: 'inbox'
  }
})

const emits = defineEmits(['changeTab'])

const tabList = computed(() =>
  BookmarkTabTypes.map(type => ({
    type,
    title: t(`page.bookmarks_index.${type}`),
    iconPath: TabIconPaths[type] ?? ''
  }))
)

const inboxClick = (type: string, index?: number) => {
  emits('changeTab', type, index)
}

// 供父组件调用，用于 scrollIntoView 定位
const getAllButtons = () => {
  return sidebarEl.value?.querySelectorAll('button') || []
}

defineExpose({
  getAllButtons
})
</script>

<style lang="scss" scoped>
.tabs-sidebar {
  --style: w-full flex flex-col;
  padding: 40px 16px 24px;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--slax-radius-sm, 8px);
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--slax-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
  font-family: inherit;

  &:hover {
    color: var(--slax-text);
    background: var(--slax-accent-bg);
  }

  &.active {
    color: var(--slax-accent);
    font-weight: 500;
    background: var(--slax-accent-bg);
  }
}

.item-icon {
  flex-shrink: 0;
  opacity: 0.8;

  .active & {
    opacity: 1;
  }
}

.sidebar-divider {
  height: 1px;
  background: var(--slax-border);
  margin: 12px 14px;
}
</style>
