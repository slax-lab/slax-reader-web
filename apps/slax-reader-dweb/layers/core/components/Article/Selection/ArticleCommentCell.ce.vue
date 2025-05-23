<template>
  <div class="article-comment-cell">
    <div class="group/comment">
      <div class="comment-header">
        <div class="left">
          <img :src="comment.isDeleted ? '' : comment.avatar" alt="" class="avatar" />
          <span class="username">{{ comment.isDeleted ? 'Deleted' : comment.username }}</span>
        </div>
        <div class="right">
          <div class="i-svg-spinners:180-ring-with-bg size-16px text-18px text-#999" v-if="comment.markId === 0 || comment.loading"></div>
        </div>
      </div>
      <div class="comment-content">{{ comment.isDeleted ? t('component.article_selection.comment_deleted') : comment.comment }}</div>
      <div class="comment-footer">
        <span class="date">{{ showCreateTime(comment) }}</span>
        <div class="operates" v-if="comment.markId !== 0 && !comment.loading">
          <template v-if="!comment.operateLoading">
            <button
              class="reply bg-[url('@images/tiny-comment-icon.png')] dark:bg-[url('@images/tiny-comment-icon-dark.png')] group-hover/comment:!opacity-100"
              @click="replyComment(comment)"
            ></button>
            <button
              class="bg-[url('@images/tiny-delete-red-outline-icon.png')] group-hover/comment:!opacity-100"
              v-if="canDeleteComment(comment)"
              @click="commentDeleteClick(comment)"
            ></button>
          </template>
          <div class="i-svg-spinners:180-ring-with-bg ml-10px text-16px text-#999" v-else-if="comment.operateLoading"></div>
        </div>
      </div>
    </div>
    <div class="child-comments" v-if="commentChildren.length > 0">
      <TransitionGroup name="opacity">
        <div class="child-comment group/child" v-for="(childComment, childIndex) in commentChildren" :key="childIndex">
          <div class="child-comment-content">
            <span class="child-username">{{ childComment.username || '' }}</span>
            <span class="reply-text">&nbsp;{{ t('common.operate.reply') }}&nbsp;</span>
            <span class="parent-username">{{ childComment.reply?.username || '' }}: </span>
            <span class="comment-content-text">{{ childComment.comment }}</span>
            <div
              class="i-svg-spinners:180-ring-with-bg ml-5px inline-block h-14px w-14px translate-y-2px text-14px text-#999 line-height-22px"
              v-if="childComment.markId === 0 || childComment.loading"
            ></div>
          </div>
          <div class="comment-footer">
            <span class="date">{{ showCreateTime(comment) }}</span>
            <div class="operates" v-if="childComment.markId !== 0 && !childComment.loading">
              <template v-if="!childComment.operateLoading">
                <button
                  class="bg-[url('@images/tiny-comment-icon.png')] dark:bg-[url('@images/tiny-comment-icon-dark.png')] group-hover/child:!opacity-100"
                  @click="replyComment(childComment)"
                ></button>
                <button
                  class="bg-[url('@images/tiny-delete-red-outline-icon.png')] group-hover/child:!opacity-100"
                  v-if="!childComment.isDeleted && canDeleteComment(childComment)"
                  @click="commentDeleteClick(childComment)"
                ></button>
              </template>
              <div class="i-svg-spinners:180-ring-with-bg text-16px text-#999" v-else-if="childComment.operateLoading"></div>
            </div>
          </div>
          <ArticleCommentInput :show-input="childComment.showInput" :placeholder="getCommentPlaceholder(childComment)" @post="text => postComment(childComment, text)" />
        </div>
      </TransitionGroup>
    </div>
    <ArticleCommentInput :show-input="comment.showInput" :placeholder="getCommentPlaceholder(comment)" @post="text => postComment(comment, text)" />
  </div>
</template>

<script setup lang="ts">
import ArticleCommentInput from './ArticleCommentInput.ce.vue'

import { formatDate } from '@commons/utils/date'

import type { MarkCommentInfo } from './type'
import { showLoginModal } from '#layers/core/components/Modal'
import { useUserStore } from '#layers/core/stores/user'
import type { PropType } from 'vue'

const emits = defineEmits(['replyComment', 'commentDelete'])

const props = defineProps({
  comment: {
    type: Object as PropType<MarkCommentInfo>,
    required: true
  },
  bookmarkUserId: {
    type: Number,
    required: true
  }
})

const commentChildren = computed(() => {
  return props.comment.children.filter(child => !child.isDeleted)
})

const t = (text: string, opts: Record<string, string> = {}) => {
  return useNuxtApp().$i18n.t(text, opts)
}

const showCreateTime = (comment: MarkCommentInfo) => {
  const now = new Date()
  const diff = (now.getTime() - comment.createdAt.getTime()) / 1000
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(diff / 3600)
  if (diff < 60) {
    return t('component.article_selection.just_now')
  } else if (diff < 3600) {
    return `${minutes} ${t(`component.article_selection.minutes_ago`)}`
  } else if (diff < 86400) {
    return `${hours} ${t(`component.article_selection.hours_ago`)}`
  } else {
    return formatDate(comment.createdAt, 'YY-MM-DD HH:mm')
  }
}

const canDeleteComment = (comment: MarkCommentInfo) => {
  const userId = useUserStore().userInfo?.userId
  return (userId === comment.userId || userId === props.bookmarkUserId) && !comment.isDeleted
}

const replyComment = (comment: MarkCommentInfo) => {
  if (comment.isDeleted) return
  if (!useUserStore().userInfo) {
    return showLoginModal({
      redirect: window.location.href
    })
  }

  comment.showInput = !comment.showInput
}

const getCommentPlaceholder = (comment: MarkCommentInfo) => {
  return t(`component.article_selection.comment_placeholder`, { username: comment.username })
}

const commentDeleteClick = (comment: MarkCommentInfo) => {
  comment.operateLoading = true
  emits('commentDelete', comment)
}

const postComment = (comment: MarkCommentInfo, replyComment: string) => {
  emits('replyComment', {
    replyToId: comment.markId,
    comment: replyComment
  })

  comment.showInput = false
}
</script>

<style lang="scss" scoped>
@use '#layers/core/styles/global.scss' as *;

.article-comment-cell {
  --style: 'px-16px pt-16px pb-20px rounded-8px not-first:mt-8px';
  --style: 'bg-#fff dark:bg-#333333FF';

  .comment-header {
    --style: flex justify-between items-center;

    .left {
      --style: select-none flex items-center;
      img {
        --style: w-24px h-24px rounded-full;
      }

      span {
        --style: ml-8px text-(13px) line-height-18px;
        --style: 'text-#999 dark:text-#ffffff66';
      }
    }

    .right {
      --style: flex items-center;
    }
  }

  .comment-header + .comment-content {
    --style: mt-12px;
  }

  .comment-content {
    --style: text-(16px) line-height-24px whitespace-pre-line;
    --style: 'text-#333 dark:text-#ffffffcc';
  }

  .comment-footer {
    --style: mt-4px flex items-center justify-between;

    .date {
      --style: text-(13px) line-height-18px select-none;
      --style: 'text-#999 dark:text-#999999ff';
    }

    .operates {
      --style: flex-center;
      button {
        --style: 'w-16px h-16px opacity-0 bg-contain not-first:(ml-10px) hover:(scale-105) active:(scale-110) transition-all duration-250';
      }
    }
  }

  .child-comments {
    --style: mt-16px pl-12px border-l-(2px solid #99999933);

    .child-comment {
      --style: 'not-first:(mt-13px) text-14px line-height-20px';

      .child-comment-content {
        --style: text-(14px) line-height-22px whitespace-pre-line;

        .child-username,
        .parent-username {
          --style: select-none;
          --style: 'text-#999 dark:text-#FFFFFF66';
        }

        .reply-text {
          --style: select-none;
          --style: 'text-#333 dark:text-#FFFFFFCC';
        }

        .comment-content-text {
          --style: 'text-#333 dark:text-#FFFFFFCC';
        }
      }
    }
  }

  // eslint-disable-next-line vue-scoped-css/no-unused-selector
  .article-comment-input {
    --style: mt-16px;
  }
}
</style>
