<template>
  <div class="notification-cell" :class="{ normal: style === NotificationCellStyle.NORMAL, simple: style === NotificationCellStyle.SIMPLE }" @click="handleClick">
    <template v-if="style === NotificationCellStyle.NORMAL">
      <div class="notification-header">
        <div class="left">
          <img :src="notification.icon" alt="" />
          <span class="highlighted" v-if="notification.type === 'reply'">{{ $t('component.notification_cell.reply_title', { username: notification.username }) }}</span>
          <span v-else>{{ notification.title }}</span>
        </div>
        <div class="right">{{ publishTime }}</div>
      </div>
      <div class="notification-content" v-if="notification.content || notification.quote_content">
        <div class="comment" v-if="!notification.quote_content">
          <span class="comment-text">{{ notification.content }}</span>
        </div>
        <div class="reply" v-else>
          <div class="reply-text">{{ notification.content }}</div>
          <div class="reply-comment">
            <span>{{ notification.quote_content }}</span>
          </div>
        </div>
      </div>
      <div class="notification-footer">
        <div class="link" v-if="notification.bookmark_title">
          <i></i>
          <span>{{ notification.bookmark_title }}</span>
        </div>
        <button>{{ $t('common.operate.view_source') }}</button>
      </div>
    </template>
    <template v-else-if="style === NotificationCellStyle.SIMPLE">
      <div class="notification-header">
        <div class="left">
          <img :src="notification.icon" alt="" />
          <span class="highlighted" v-if="notification.type === 'reply'">{{ $t('component.notification_cell.reply_title', { username: notification.username }) }}</span>
          <span v-else>{{ notification.title }}</span>
        </div>
        <div class="right">
          <span>{{ publishTime }}</span>
        </div>
      </div>
      <div class="notification-content">
        <div class="comment" v-if="!notification.quote_content">
          <span class="comment-text">{{ notification.content }}</span>
          <div class="link" v-if="notification.bookmark_title">
            <i></i>
            <span>{{ notification.bookmark_title }}</span>
          </div>
        </div>
        <div class="reply" v-else>
          <div class="reply-text">{{ notification.content }}</div>
          <div class="reply-comment">
            <span>{{ notification.quote_content }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export enum NotificationCellStyle {
  SIMPLE = 'simple',
  NORMAL = 'normal'
}
</script>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import type { UserNotificationMessageItem } from '@commons/types/interface'

const props = defineProps({
  notification: {
    type: Object as PropType<UserNotificationMessageItem>,
    required: true
  },
  style: {
    type: String as PropType<NotificationCellStyle>,
    default: NotificationCellStyle.NORMAL
  }
})

const { t } = useI18n()

const $config = useNuxtApp().$config.public

const publishTime = computed(() => {
  const now = new Date()
  const publishTime = new Date(props.notification.created_at)
  const diffTime = now.getTime() - publishTime.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  // xx小时前 / xx分钟前 / 刚刚
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours > 0) {
      return `${diffHours} ${t('component.article_selection.hours_ago')}`
    }
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    if (diffMinutes > 0) {
      return `${diffMinutes} ${t('component.article_selection.minutes_ago')}`
    }
    return t('component.article_selection.just_now')
  }
  return publishTime.toDateString()
})

const handleClick = (): void => {
  const notification = props.notification
  const objectData = notification.object_data
  const { type, source, is_read: isRead, id } = notification
  const notificationParam = isRead ? '' : `&notification_id=${id}`

  const getCommentUrl = (): string => {
    const baseUrl = source === 'share' ? `/s/${objectData.share_code}` : `/c/${objectData.collection_code}/${objectData.cb_id}`
    return `${baseUrl}?highlight=${objectData.comment_id}${notificationParam}`
  }

  const markNotificationRead = async () => {
    if (!id || isRead) return
    await request.post({ url: RESTMethodPath.NOTIFICATION_MARK_READ, body: { id } })
  }

  const urlMap: Record<string, () => string> = {
    comment: getCommentUrl,
    reply: getCommentUrl,
    collection_update: () => `/c/${objectData.collection_code}/${objectData.bookmark_id}`,
    collection_price_change: () => `/c/${objectData.collection_code}`
  }

  const jumpUrl = urlMap[type]()
  markNotificationRead()
  window.open(jumpUrl, '_blank')
}
</script>

<style lang="scss" scoped>
.notification-cell {
  --style: 'rounded-8px cursor-pointer transition-all duration-250 !active:(scale-102) select-none';

  &.normal {
    --style: 'bg-#F5F5F3 px-24px py-16px not-first:(mt-10px) hover:(scale-101)';
    .notification-header {
      --style: flex items-center justify-between;

      .left {
        --style: flex items-center;

        img {
          --style: w-24px h-24px rounded-full;
        }

        span {
          --style: ml-8px text-(12px #999) line-height-17px;

          &.highlighted {
            --style: text-#F6AF69;
          }
        }
      }

      .right {
        --style: ml-8px text-(12px #999) line-height-17px shrink-0;
      }
    }

    .notification-content {
      --style: mt-12px;
      .comment {
        .comment-text {
          --style: text-(16px #333) line-heigh-24px line-clamp-2;
        }

        .link {
          --style: mt-11px flex items-center;

          i {
            --style: w-16px h-16px bg-contain flex-shrink-0;
            background-image: url('@images/tiny-href-gray-icon.png');
          }

          span {
            --style: ml-4px text-(14px #999 ellipsis) line-height-22px whitespace-nowrap overflow-hidden;
          }
        }
      }

      .reply {
        .reply-text {
          --style: text-(16px #333) line-heigh-24px line-clamp-1;
        }

        .reply-comment {
          --style: pl-10px relative mt-9px flex;
          span {
            --style: ml-4px text-(14px #999 ellipsis) line-height-22px whitespace-nowrap overflow-hidden;
          }

          &::after {
            --style: content-empty absolute left-0 top-1/2 w-2px h-21px bg-#d6d6d6 -translate-y-1/2;
          }
        }
      }
    }

    .notification-footer {
      --style: mt-12px flex items-center;
      .link {
        --style: flex items-center shrink-1 overflow-hidden;

        i {
          --style: w-16px h-16px bg-contain flex-shrink-0;
          background-image: url('@images/tiny-href-gray-icon.png');
        }

        span {
          --style: ml-4px text-(14px #333 ellipsis) line-height-22px whitespace-nowrap overflow-hidden;
        }
      }

      button {
        --style: 'ml-auto px-10px shrink-0 text-(14px #5490c2) line-height-20px hover:(scale-102) active:(scale-105) transition-all duration-250';
      }
    }
  }

  &.simple {
    --style: 'py-16px px-14px hover:(bg-#F5F5F3)';
    .notification-header {
      --style: flex justify-between items-start;
      .left {
        --style: flex items-start;
        img {
          --style: w-24px h-24px rounded-full;
        }
        span {
          --style: ml-16px text-(13px #999) line-height-18px;

          &.highlighted {
            --style: text-#F6AF69;
          }
        }
      }

      .right {
        --style: text-(13px #999) line-height-18px shrink-0;
      }
    }

    .notification-content {
      --style: mt-2px pl-40px;

      .comment {
        .comment-text {
          --style: text-(16px #333) line-heigh-24px line-clamp-2;
        }

        .link {
          --style: mt-11px flex items-center;

          i {
            --style: w-16px h-16px bg-contain flex-shrink-0;
            background-image: url('@images/tiny-href-gray-icon.png');
          }

          span {
            --style: ml-4px text-(14px #999 ellipsis) line-height-22px whitespace-nowrap overflow-hidden;
          }
        }
      }

      .reply {
        .reply-text {
          --style: text-(16px #333) line-heigh-24px line-clamp-1;
        }

        .reply-comment {
          --style: pl-10px relative mt-9px flex;
          span {
            --style: ml-4px text-(14px #999 ellipsis) line-height-22px whitespace-nowrap overflow-hidden;
          }

          &::after {
            --style: content-empty absolute left-0 top-1/2 w-2px h-21px bg-#d6d6d6 -translate-y-1/2;
          }
        }
      }
    }
  }
}
</style>
