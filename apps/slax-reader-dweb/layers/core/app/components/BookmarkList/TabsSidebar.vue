<template>
  <!-- 竖向导航侧边栏：替代原横向 tab 列表 -->
  <nav class="tabs-sidebar" ref="sidebarEl">
    <!-- 主导航项 -->
    <button v-for="(item, index) in tabList" :key="item.type" class="sidebar-item" :class="{ active: tabType === item.type }" @click="inboxClick(item.type, index)" type="button">
      <!-- inline SVG icon，不依赖图片文件 -->
      <svg class="item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" v-html="item.iconPath" />
      <span>{{ item.title }}</span>
    </button>

    <!-- 分隔线 -->
    <div class="sidebar-divider" />

    <!-- 废纸篓 -->
    <button class="sidebar-item" :class="{ active: tabType === 'trashed' }" @click="inboxClick('trashed')" type="button">
      <svg class="item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
      <span>{{ $t('page.bookmarks_index.Trash') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { BookmarkTabTypes } from '#layers/core/app/composables/useBookmarkRelative'

const { t } = useI18n()
const sidebarEl = ref<HTMLElement>()

defineProps({
  tabType: {
    type: String,
    default: 'inbox'
  }
})

const emits = defineEmits(['changeTab'])

// 每个 tab 对应的 inline SVG path 内容
const iconPaths: Record<string, string> = {
  inbox: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8M8 12h6M8 16h4"/>',
  starred: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  topics:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  highlights: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>'
}

// 构建 tab 列表（含 collections 扩展支持）
const tabList = computed(() =>
  BookmarkTabTypes.map(type => ({
    type,
    title: t(`page.bookmarks_index.${type}`),
    iconPath: iconPaths[type] ?? ''
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
  font-size: 13px;
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
