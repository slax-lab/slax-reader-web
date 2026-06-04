<template>
  <article class="comment-item" :class="{ 'is-active': isActive, 'comment-item-article': !hasSource }" :data-comment-info-id="infoId" @click="$emit('card-click', infoId)">
    <!-- 主评论（取 comments[0]） -->
    <template v-if="mainComment">
      <!-- 引用块 -->
      <blockquote v-if="hasSource" class="comment-quote">{{ quoteText }}</blockquote>
      <span v-else class="comment-scope-badge">{{ $t('page.bookmarks_detail.comment_all') }}</span>

      <!-- 评论正文 -->
      <p v-if="mainComment.comment" class="comment-reply">{{ mainComment.comment }}</p>

      <div class="comment-meta">
        <button v-if="allowAction" class="comment-reply-trigger" @click.stop="$emit('reply', mainComment)">
          {{ $t('common.operate.reply') }}
        </button>
        <span>
          <span class="comment-author">{{ mainComment.username }}</span>
          <template v-if="mainComment.createdAt"> · {{ formatRelativeTime(mainComment.createdAt) }}</template>
        </span>
      </div>

      <!-- 子评论 -->
      <div v-if="mainComment.children?.length" class="comment-sub-list" @click.stop>
        <div v-for="child in mainComment.children" :key="child.markUid" class="comment-sub">
          <p class="comment-sub-text">
            <span v-if="child.reply?.username" class="comment-sub-reply-to">{{ `@${child.reply.username} ` }}</span
            >{{ child.comment }}
          </p>
          <div class="comment-sub-time">
            <span>
              <span class="comment-author">{{ child.username }}</span>
              <template v-if="child.createdAt"> · {{ formatRelativeTime(child.createdAt) }}</template>
            </span>
            <button v-if="allowAction && child.markUid" class="comment-sub-reply-btn" @click.stop="$emit('reply', child)">
              {{ $t('common.operate.reply') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 仅有引用无评论（纯划线） -->
    <template v-else>
      <blockquote v-if="hasSource" class="comment-quote">{{ quoteText }}</blockquote>
      <span v-else class="comment-scope-badge">{{ $t('page.bookmarks_detail.comment_all') }}</span>
      <div class="comment-meta">
        <button v-if="allowAction" class="comment-reply-trigger" @click.stop="$emit('reply-stroke')">
          {{ $t('common.operate.reply') }}
        </button>
        <span v-if="strokeUser">
          <span class="comment-author">{{ strokeUser.username }}</span>
          <template v-if="strokeUser.createdAt"> · {{ formatRelativeTime(strokeUser.createdAt) }}</template>
        </span>
      </div>
    </template>
  </article>
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
  strokeUser?: { username: string; avatar?: string; createdAt?: Date | string }
}>()

defineEmits<{
  'card-click': [infoId: string]
  reply: [comment: MarkCommentInfo]
  'reply-stroke': []
}>()

const hasSource = computed(() => props.source.length > 0)
const mainComment = computed(() => props.comments[0] ?? null)

const formatRelativeTime = (date: Date | string | undefined) => {
  if (!date) return ''
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
@keyframes comment-flash {
  0% {
    background: var(--slax-accent-bg);
    border-color: var(--slax-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--slax-accent) 12%, transparent);
  }
  100% {
    background: var(--slax-surface);
    border-color: var(--slax-border);
    box-shadow: none;
  }
}

.comment-item {
  padding: 12px 14px;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--slax-accent) 25%, transparent);
    box-shadow:
      0 2px 8px color-mix(in srgb, var(--slax-accent) 5%, transparent),
      inset 0 1px 0 var(--slax-inset-hi);
    transform: translateY(-1px);
  }

  &.comment-item-article {
    cursor: default;

    &:hover {
      transform: none;
    }

    .comment-reply {
      margin-top: 0;
    }
  }

  &.is-active {
    animation: comment-flash 5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .comment-scope-badge {
    font-size: 12px;
    padding: 1px 8px;
    background: var(--slax-accent-bg);
    color: var(--slax-accent);
    border-radius: 10px;
    font-weight: 400;
    letter-spacing: 0.02em;
    display: inline-block;
    margin-bottom: 8px;
  }

  .comment-quote {
    margin: 0;
    padding: 7px 10px 7px 11px;
    border-left: 3px solid var(--slax-accent);
    background: var(--slax-accent-bg);
    border-radius: 0 4px 4px 0;
    font-size: 12px;
    line-height: 1.65;
    color: var(--slax-text-muted);
  }

  .comment-reply {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.65;
    color: var(--slax-text);
  }

  .comment-meta {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    font-size: 12px;
    color: var(--slax-text-light);
    font-weight: 300;

    .comment-author {
      color: var(--slax-text-muted);
      font-weight: 500;
    }

    .comment-reply-trigger {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      font-size: 12px;
      color: var(--slax-accent);
      cursor: pointer;
      opacity: 0.75;
      transition: opacity 0.15s;

      &:hover {
        opacity: 1;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    }
  }

  .comment-sub-list {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--slax-border);
    display: flex;
    flex-direction: column;
    gap: 12px;

    .comment-sub {
      padding-left: 10px;
      border-left: 2px solid var(--slax-accent-bg);

      .comment-sub-text {
        font-size: 13px;
        line-height: 1.6;
        color: var(--slax-text);
        margin: 0 0 4px;
        white-space: pre-wrap;
        word-break: break-word;

        .comment-sub-reply-to {
          color: var(--slax-accent);
          font-weight: 500;
        }
      }

      .comment-sub-time {
        font-size: 12px;
        color: var(--slax-text-light);
        font-weight: 300;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .comment-author {
          color: var(--slax-text-muted);
          font-weight: 500;
        }

        .comment-sub-reply-btn {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          font-size: 12px;
          color: var(--slax-accent);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
          margin-left: 4px;

          &:hover {
            text-decoration: underline;
            text-underline-offset: 3px;
          }
        }
      }

      &:hover .comment-sub-reply-btn {
        opacity: 0.75;
      }
    }
  }
}
</style>
