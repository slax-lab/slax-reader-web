<template>
  <!-- 主列表内容：按 filterStatus 分发 书签（日期分组）/ 高亮 两种列表 -->
  <div class="bookmarks">
    <template v-if="filterStatus !== 'highlights'">
      <ClientOnly>
        <Transition name="list-mode" mode="out-in">
          <WindowVirtualizer :key="effectiveMode" :data="displayItems" :buffer-size="600">
            <template #default="{ item }">
              <BookmarkDateGroup v-if="item.type === 'group'" :label="item.label" />
              <BookmarkCell
                v-else
                :index="item.index"
                :is-subscribe="filterStatus === 'collections'"
                :bookmark="item.bookmark"
                :collection-code="filterCollectionCode"
                :class="{ 'text-mode': effectiveMode === 'text' }"
                @delete="(id: number) => emit('delete', id)"
                @archive-update="(id: number, archive: boolean) => emit('archive-update', id, archive)"
                @alias-title-update="(id: number, aliasTitle: string) => emit('alias-title-update', id, aliasTitle)"
                @bookmark-update="(id: number, bookmark: BookmarkItem) => emit('bookmark-update', id, bookmark)"
              />
            </template>
          </WindowVirtualizer>
        </Transition>
        <template #fallback>
          <template
            v-for="item in displayItems.slice(0, 20)"
            :key="item.type === 'group' ? item.key : item.bookmark.id"
          >
            <BookmarkDateGroup v-if="item.type === 'group'" :label="item.label" />
            <BookmarkCell
              v-else
              :index="item.index"
              :is-subscribe="filterStatus === 'collections'"
              :bookmark="item.bookmark"
              :collection-code="filterCollectionCode"
              :class="{ 'text-mode': effectiveMode === 'text' }"
              @delete="(id: number) => emit('delete', id)"
              @archive-update="(id: number, archive: boolean) => emit('archive-update', id, archive)"
              @alias-title-update="(id: number, aliasTitle: string) => emit('alias-title-update', id, aliasTitle)"
              @bookmark-update="(id: number, bookmark: BookmarkItem) => emit('bookmark-update', id, bookmark)"
            />
          </template>
        </template>
      </ClientOnly>
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
import { WindowVirtualizer } from 'virtua/vue'

import BookmarkCell from '#layers/core/app/components/BookmarkList/BookmarkCell.vue'
import BookmarkDateGroup from '#layers/core/app/components/BookmarkList/BookmarkDateGroup.vue'
import BookmarkHighlightCell from '#layers/core/app/components/BookmarkList/BookmarkHighlightCell.vue'

import type { BookmarkItem, HighlightItem } from '@commons/types/interface'
import { useMediaQuery } from '@vueuse/core'

type GroupedItem = { type: 'group'; label: string; key: string } | { type: 'bookmark'; bookmark: BookmarkItem; index: number }

const props = defineProps<{
  filterStatus: string
  groupedBookmarks: GroupedItem[]
  highlights: HighlightItem[]
  listMode: 'card' | 'text'
  filterCollectionCode: string
}>()

// ≤768 强制文字列表
const isH5 = useMediaQuery('(max-width: 768px)')
const effectiveMode = computed<'card' | 'text'>(() => (isH5.value ? 'text' : props.listMode))

// 文字视图下不按月分段
const displayItems = computed<GroupedItem[]>(() =>
  effectiveMode.value === 'text'
    ? props.groupedBookmarks.filter(item => item.type !== 'group')
    : props.groupedBookmarks
)

const emit = defineEmits<{
  delete: [id: number]
  'archive-update': [id: number, archive: boolean]
  'alias-title-update': [id: number, aliasTitle: string]
  'bookmark-update': [id: number, bookmark: BookmarkItem]
}>()
</script>

<style lang="scss" scoped>
// 模式切换：快速淡出 + 向上滑入
.list-mode-leave-active {
  transition: opacity 0.08s ease;
}
.list-mode-leave-to {
  opacity: 0;
}
.list-mode-enter-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.list-mode-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.bookmarks {
  --style: relative;

  .card-cells-wrapper {
    --style: px-16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

// text-mode：紧凑文字模式，移除卡片阴影和边框，重置 margin
:deep(.text-mode.article-card) {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  padding: 10px 20px;
  border-radius: 0;
  border-bottom: 1px solid var(--slax-border);
  margin-bottom: 0;

  &:hover {
    background: var(--slax-accent-bg);
    border-color: transparent;
    box-shadow: none;
    transform: none;
  }

  .article-actions {
    margin-right: -10px;
  }
}

// ≤768 文字列表紧凑排版
@media (max-width: 768px) {
  :deep(.text-mode.article-card) {
    padding: 16px 0;
    gap: 14px;

    &:hover {
      background: transparent;
    }

    .article-num {
      min-width: 24px;
      font-size: 14px;
      padding-top: 3px;
      text-align: center;
    }

    .article-body {
      padding-right: 32px;
    }

    .article-title {
      font-size: 17px;
      line-height: 1.5;
      margin-bottom: 6px;
    }

    .article-meta {
      gap: 8px;
      min-width: 0;
    }

    .article-date,
    .article-source {
      font-size: 12px;
    }

    .article-source {
      background: transparent;
      border-left: 1px solid var(--slax-border);
      border-radius: 0;
      color: var(--slax-text-light);
      padding: 0 0 0 8px;
      max-width: 54vw;
    }

    .article-actions {
      display: none;
    }

    .article-star {
      right: 0;
      top: 16px;
      width: 32px;
      height: 28px;
      border-radius: 0;

      svg {
        width: 13px;
        height: 13px;
      }
    }
  }
}
</style>
