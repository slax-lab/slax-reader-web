<template>
  <div class="comment-list-panel">
    <div class="comment-list-header">
      <span class="comment-title">{{ $t('page.bookmarks_detail.comments') }}</span>
      <span v-if="totalCount > 0" class="comment-badge">{{ totalCount }}</span>
    </div>

    <div v-if="infos.length === 0" class="comment-empty">
      {{ $t('page.bookmarks_detail.no_comments') }}
    </div>

    <div v-else class="comment-cards">
      <SnapshotCommentCard
        v-for="info in infos"
        :key="info.id"
        :info-id="info.id"
        :source="info.source"
        :comments="info.comments"
        :is-active="activeInfoId === info.id"
        :allow-action="allowAction"
        :quote-text="getQuoteText(info)"
        @card-click="$emit('card-click', $event)"
        @reply="$emit('reply', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import SnapshotCommentCard from './SnapshotCommentCard.vue'

import type { MarkCommentInfo, MarkItemInfo } from '@slax-reader/selection/types'

const props = defineProps<{
  infos: MarkItemInfo[]
  activeInfoId: string | null
  allowAction?: boolean
}>()

defineEmits<{
  'card-click': [infoId: string]
  reply: [comment: MarkCommentInfo]
}>()

const totalCount = computed(() => {
  return props.infos.reduce((acc, info) => {
    const countComments = (comments: MarkCommentInfo[]): number => comments.reduce((sum, c) => sum + 1 + countComments(c.children ?? []), 0)
    return acc + countComments(info.comments)
  }, 0)
})

const getQuoteText = (info: MarkItemInfo): string => {
  // 从 source 路径中提取文本（仅 text 类型）
  if (!info.source.length) return ''
  const textItems = info.source.filter(s => s.type === 'text')
  if (!textItems.length) return ''
  // 从 DOM 中读取对应路径的文本
  try {
    const texts = textItems.map(item => {
      const el = document.querySelector(item.path)
      if (!el) return ''
      const text = el.textContent || ''
      return text.slice(item.start ?? 0, item.end ?? text.length)
    })
    return texts.join('')
  } catch {
    return ''
  }
}
</script>

<style lang="scss" scoped>
.comment-list-panel {
  --style: flex flex-col h-full;
}

.comment-list-header {
  --style: flex items-center gap-8px px-16px py-12px border-b-(1px solid border) flex-none;
}

.comment-title {
  font-size: var(--slax-fs-meta);
  font-weight: 500;
  color: var(--slax-text);
}

.comment-badge {
  --style: 'inline-flex items-center justify-center min-w-18px h-18px px-4px rounded-full text-tag font-500';
  background: var(--slax-accent);
  color: white;
}

.comment-empty {
  --style: flex-1 flex items-center justify-center text-aux;
  color: var(--slax-text-light);
}

.comment-cards {
  --style: flex-1 overflow-y-auto;
}
</style>
