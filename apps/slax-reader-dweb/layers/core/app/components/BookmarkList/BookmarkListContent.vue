<template>
  <!-- 主列表内容：按 filterStatus 分发 书签（日期分组）/ 高亮 两种列表 -->
  <div class="bookmarks">
    <template v-if="filterStatus !== 'highlights'">
      <TransitionGroup :name="loading ? '' : 'opacity'" @after-leave="emit('transition-leave')">
        <template v-for="item in displayItems" :key="item.type === 'group' ? item.key : item.bookmark.id">
          <BookmarkDateGroup v-if="item.type === 'group'" :label="item.label" />
          <BookmarkCell
            v-else
            :index="item.index"
            :is-subscribe="filterStatus === 'collections'"
            :bookmark="item.bookmark"
            :collection-code="filterCollectionCode"
            :class="{ 'text-mode': listMode === 'text' }"
            @delete="(id: number) => emit('delete', id)"
            @archive-update="(id: number, archive: boolean) => emit('archive-update', id, archive)"
            @alias-title-update="(id: number, aliasTitle: string) => emit('alias-title-update', id, aliasTitle)"
            @bookmark-update="(id: number, bookmark: BookmarkItem) => emit('bookmark-update', id, bookmark)"
          />
        </template>
      </TransitionGroup>
    </template>
    <template v-else-if="filterStatus === 'highlights'">
      <div class="card-cells-wrapper">
        <BookmarkHighlightCell v-for="highlight in highlights" :key="highlight.id" :highlight="highlight" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BookmarkCell from '#layers/core/app/components/BookmarkList/BookmarkCell.vue'
import BookmarkDateGroup from '#layers/core/app/components/BookmarkList/BookmarkDateGroup.vue'
import BookmarkHighlightCell from '#layers/core/app/components/BookmarkList/BookmarkHighlightCell.vue'

import type { BookmarkItem, HighlightItem } from '@commons/types/interface'

// 日期分组条目类型（与 useBookmarkData 的 groupedBookmarks 一致）
type GroupedItem = { type: 'group'; label: string; key: string } | { type: 'bookmark'; bookmark: BookmarkItem; index: number }

const props = defineProps<{
  filterStatus: string
  groupedBookmarks: GroupedItem[]
  highlights: HighlightItem[]
  listMode: 'card' | 'text'
  loading: boolean
  filterCollectionCode: string
}>()

// 文字视图下不按月分段：过滤掉日期分组标签，仅保留书签
const displayItems = computed<GroupedItem[]>(() => (props.listMode === 'text' ? props.groupedBookmarks.filter(item => item.type !== 'group') : props.groupedBookmarks))

const emit = defineEmits<{
  delete: [id: number]
  'archive-update': [id: number, archive: boolean]
  'alias-title-update': [id: number, aliasTitle: string]
  'bookmark-update': [id: number, bookmark: BookmarkItem]
  'transition-leave': []
}>()
</script>

<style lang="scss" scoped>
.bookmarks {
  --style: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  // 文字模式下移除卡片间距
  &:has(.text-mode) {
    gap: 0;
  }

  .card-cells-wrapper {
    --style: px-16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

// text-mode：紧凑文字模式，移除卡片阴影和边框
:deep(.text-mode.article-card) {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  padding: 10px 20px;
  border-radius: 0;
  border-bottom: 1px solid var(--slax-border);

  &:hover {
    background: var(--slax-accent-bg);
    border-color: transparent;
    box-shadow: none;
    transform: none;
  }

  // 文字模式下操作按钮右侧负边距，贴近卡片右边缘
  .article-actions {
    margin-right: -10px;
  }
}
</style>
