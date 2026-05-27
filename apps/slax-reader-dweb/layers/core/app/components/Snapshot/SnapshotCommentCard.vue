<template>
  <div class="comment-card" :class="{ 'is-active': isActive }" :data-comment-info-id="infoId" @click="$emit('card-click', infoId)">
    <!-- 引用块（source 非空时显示） -->
    <div v-if="hasSource" class="comment-quote">
      <span class="quote-text">{{ quoteText }}</span>
    </div>
    <div v-else class="comment-scope-badge">{{ $t('page.bookmarks_detail.comment_all') }}</div>

    <!-- 评论列表 -->
    <div class="comment-list">
      <div v-for="comment in comments" :key="comment.markUid" class="comment-item">
        <img class="comment-avatar" :src="comment.avatar || defaultAvatar" :alt="comment.username" />
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-username">{{ comment.username }}</span>
            <time class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</time>
          </div>
          <div v-if="comment.reply" class="comment-reply-to">{{ $t('page.bookmarks_detail.reply_to') }} @{{ comment.reply.username }}</div>
          <p class="comment-text">{{ comment.comment }}</p>
          <button v-if="allowAction" class="comment-reply-btn" @click.stop="$emit('reply', comment)">
            {{ $t('common.operate.reply') }}
          </button>

          <!-- 子评论 -->
          <div v-if="comment.children?.length" class="comment-sub-list">
            <div v-for="child in comment.children" :key="child.markUid" class="comment-item comment-sub">
              <img class="comment-avatar" :src="child.avatar || defaultAvatar" :alt="child.username" />
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-username">{{ child.username }}</span>
                  <time class="comment-time">{{ formatRelativeTime(child.createdAt) }}</time>
                </div>
                <div v-if="child.reply" class="comment-reply-to">{{ $t('page.bookmarks_detail.reply_to') }} @{{ child.reply.username }}</div>
                <p class="comment-text">{{ child.comment }}</p>
                <button v-if="allowAction" class="comment-reply-btn" @click.stop="$emit('reply', child)">
                  {{ $t('common.operate.reply') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { MarkCommentInfo, MarkItemInfo } from '@slax-reader/selection/types'

const props = defineProps<{
  infoId: string
  source: MarkItemInfo['source']
  comments: MarkCommentInfo[]
  isActive?: boolean
  allowAction?: boolean
  quoteText?: string
}>()

defineEmits<{
  'card-click': [infoId: string]
  reply: [comment: MarkCommentInfo]
}>()

const defaultAvatar = '/images/user-default-avatar.png'

const hasSource = computed(() => props.source.length > 0)

const formatRelativeTime = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(date)
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return useNuxtApp().$i18n.t('page.bookmarks_detail.just_now')
  if (minutes < 60) return useNuxtApp().$i18n.t('page.bookmarks_detail.minutes_ago', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return useNuxtApp().$i18n.t('page.bookmarks_detail.hours_ago', { n: hours })
  return d.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.comment-card {
  --style: 'px-16px py-12px border-b-(1px solid border) cursor-pointer transition-colors duration-fast';

  &:hover {
    background: var(--slax-accent-bg);
  }

  &.is-active {
    animation: comment-flash 1.2s ease-out;
  }
}

@keyframes comment-flash {
  0% {
    background: var(--slax-accent-bg);
  }
  100% {
    background: transparent;
  }
}

.comment-quote {
  --style: 'mb-8px px-10px py-6px rounded-sm text-aux line-clamp-3';
  border-left: 2px solid var(--slax-accent-soft);
  color: var(--slax-text-muted);
  font-style: italic;
}

.comment-scope-badge {
  --style: 'mb-8px inline-flex px-8px py-2px rounded-full text-tag';
  background: var(--slax-accent-bg);
  color: var(--slax-accent);
}

.comment-list {
  --style: flex flex-col gap-10px;
}

.comment-item {
  --style: flex gap-8px;

  &.comment-sub {
    --style: ml-28px mt-6px;
  }
}

.comment-avatar {
  --style: flex-none w-22px h-22px rounded-full object-cover;
}

.comment-body {
  --style: flex-1 min-w-0;
}

.comment-meta {
  --style: flex items-center gap-8px mb-2px;
}

.comment-username {
  font-size: var(--slax-fs-tag);
  font-weight: 500;
  color: var(--slax-text);
}

.comment-time {
  font-size: var(--slax-fs-tag);
  color: var(--slax-text-light);
}

.comment-reply-to {
  font-size: var(--slax-fs-tag);
  color: var(--slax-text-light);
  margin-bottom: 2px;
}

.comment-text {
  font-size: var(--slax-fs-aux);
  color: var(--slax-text);
  line-height: 1.6;
  word-break: break-word;
}

.comment-reply-btn {
  --style: 'mt-4px text-tag cursor-pointer transition-colors duration-fast';
  color: var(--slax-text-light);
  background: transparent;

  &:hover {
    color: var(--slax-accent);
  }
}
</style>
