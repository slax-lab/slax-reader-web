<template>
  <div class="comment-list-panel">
    <div class="comment-list-header">
      <span class="comment-title">{{ $t('page.bookmarks_detail.comments') }}</span>
      <span v-if="totalCount > 0" class="comment-badge">{{ totalCount }}</span>
    </div>

    <div v-if="displayCards.length === 0" class="comment-empty">
      {{ $t('page.bookmarks_detail.no_comments') }}
    </div>

    <div v-else class="comment-cards">
      <SnapshotCommentCard
        v-for="(card, idx) in displayCards"
        :key="`${card.infoId}-${idx}`"
        :info-id="card.infoId"
        :source="card.source"
        :comments="card.comments"
        :stroke-user="card.strokeUser"
        :is-active="activeInfoId === card.infoId"
        :allow-action="allowAction"
        :quote-text="card.quoteText"
        @card-click="$emit('card-click', $event)"
        @reply="$emit('reply', $event)"
        @reply-stroke="$emit('reply-stroke', card.infoId)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import SnapshotCommentCard from './SnapshotCommentCard.vue'

import type { UserList } from '@commons/types/interface'
import type { MarkCommentInfo, MarkItemInfo, MarkPathItem } from '@slax-reader/selection/types'

const props = defineProps<{
  infos: MarkItemInfo[]
  activeInfoId: string | null
  allowAction?: boolean
  userList?: UserList
}>()

defineEmits<{
  'card-click': [infoId: string]
  reply: [comment: MarkCommentInfo]
  'reply-stroke': [infoId: string]
}>()

interface DisplayCard {
  infoId: string
  source: MarkPathItem[]
  comments: MarkCommentInfo[]
  strokeUser: { username: string; avatar?: string; createdAt?: Date | string } | undefined
  quoteText: string
}

const totalCount = computed(() => {
  return props.infos.reduce((acc, info) => {
    const countComments = (comments: MarkCommentInfo[]): number => comments.reduce((sum, c) => sum + 1 + countComments(c.children ?? []), 0)
    return acc + countComments(info.comments)
  }, 0)
})

const getStrokeUser = (info: MarkItemInfo) => {
  if (!props.userList || !info.stroke.length) return undefined
  const userId = info.stroke[0]?.userId
  if (!userId) return undefined
  const user = props.userList[String(userId)]
  if (!user) return undefined
  return { username: user.username, avatar: user.avatar }
}

const getQuoteText = (info: MarkItemInfo): string => {
  // 优先用 approx.exact（服务端存储的精确文本，不依赖 DOM）
  if (info.approx?.exact) return info.approx.exact

  if (!info.source.length) return ''
  const textItems = info.source.filter(s => s.type === 'text')
  if (!textItems.length) return ''
  try {
    return textItems
      .map(item => {
        const el = document.querySelector(item.path)
        if (!el) return ''
        const text = el.textContent || ''
        return text.slice(item.start ?? 0, item.end ?? text.length)
      })
      .join('')
  } catch {
    return ''
  }
}

// 将每个 MarkItemInfo 按评论展开：
// - 有 N 条评论 → N 张卡片（划线数据并入每张卡片，不单独展示）
// - 纯划线（无评论）→ 1 张卡片
const displayCards = computed((): DisplayCard[] => {
  const cards: DisplayCard[] = []
  for (const info of props.infos) {
    const strokeUser = getStrokeUser(info)
    const quoteText = getQuoteText(info)
    if (info.comments.length > 0) {
      for (const comment of info.comments) {
        cards.push({ infoId: info.id, source: info.source, comments: [comment], strokeUser, quoteText })
      }
    } else {
      cards.push({ infoId: info.id, source: info.source, comments: [], strokeUser, quoteText })
    }
  }
  return cards
})
</script>

<style lang="scss" scoped>
.comment-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.comment-list-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 24px 0;
  margin-bottom: 12px;
}

.comment-title {
  font-family: var(--slax-font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--slax-text);
  line-height: 1.4;
}

.comment-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  font-size: var(--slax-fs-tag);
  font-weight: 500;
  background: var(--slax-accent);
  color: white;
}

.comment-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--slax-fs-aux);
  color: var(--slax-text-light);
}

.comment-cards {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
