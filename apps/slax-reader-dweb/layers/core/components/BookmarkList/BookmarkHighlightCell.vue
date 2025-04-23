<template>
  <div class="bookmark-item clickable" @click="jumpToOriginal(highlight)">
    <div v-if="highlight.title" class="article-header">
      <div class="article-title">
        <time>{{ dateString(highlight.created_at) }}</time>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="content-container">
        <div class="content">
          <template v-if="highlight.type === 'mark'">
            <div class="cell-title stroke">{{ getContent(highlight) }}</div>
          </template>
          <template v-else-if="highlight.type === 'comment'">
            <div class="cell-title">{{ highlight.comment }}</div>
            <div class="quote-content">
              {{ getContent(highlight) }}
            </div>
          </template>
          <template v-else-if="highlight.type === 'reply'">
            <div class="cell-title">{{ highlight.comment }}</div>
            <div class="quote-content" :class="{ deleted: highlight.parent_comment_deleted }">
              {{ !highlight.parent_comment_deleted ? highlight.parent_comment : $t('page.bookmarks_index.content_deleted') }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="item-footer">
      <img src="@images/tiny-href-gray-icon.png" alt="" />
      <span>{{ highlight.title }}</span>
      <span class="source">{{ $t('page.bookmarks_index.view_original') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@commons/utils/date'

import type { HighlightItem } from '@commons/types/interface'
import type { PropType } from 'vue'

defineProps({
  highlight: {
    type: Object as PropType<HighlightItem>,
    required: true
  }
})

const dateString = (date: string) => {
  return formatDate(new Date(date), 'YYYY-MM-DD HH:mm')
}

const getContent = (item: HighlightItem) => {
  return item.content
    .filter(content => content.type !== 'image')
    .map(content => content.text)
    .join('')
    .replaceAll('\n', '')
    .replaceAll('\t', '')
}

const jumpToOriginal = (item: HighlightItem) => {
  let jumpUrl = ''
  switch (item.source_type) {
    case 'share':
      jumpUrl = `/s/${item.source_id}?highlight=${item.id}`
      break
    case 'collection':
      jumpUrl = `/c/${item.source_id}?highlight=${item.id}`
      break
    default:
      jumpUrl = `/bookmarks/${item.source_id}?highlight=${item.id}`
  }
  pwaOpen({
    url: jumpUrl
  })
}
</script>

<style lang="scss" scoped>
.bookmark-item {
  --style: 'bg-#F5F5F3 rounded-8px py-16px px-24px select-none not-first:(mt-10px)';

  .article-header {
    .article-title {
      --style: text-(12px #999) line-height-17px;
    }
  }

  .content-wrapper {
    --style: pt-8px;
    .content-container {
      .content {
        --style: flex flex-col justify-start items-start;
        .cell-title {
          --style: inline-block text-(14px #0f1419 truncate) line-height-22px font-500 max-w-full;
        }

        .stroke {
          --style: pb-2px border-b-(1.5px solid #f6af69);
        }

        .quote-content {
          --style: pl-8px w-full text-(14px #999 ellipsis) line-height-22px border-l-(2px solid #d6d6d6) overflow-hidden whitespace-nowrap;

          &.deleted {
            --style: pl-0 border-0 line-through;
          }
        }

        div + div {
          --style: mt-8px;
        }
      }
    }
  }

  .item-footer {
    --style: mt-19px flex items-center;
    img {
      --style: object-contain w-16px h-16px;
    }

    span {
      --style: ml-4px text-(14px #333 ellipsis) line-height-22px overflow-hidden whitespace-nowrap;
    }

    .source {
      --style: 'max-md:(hidden) shrink-0 text-#5490C2 ml-auto pl-10px';
    }
  }
}

.clickable {
  --style: 'cursor-pointer transition-all duration-250 hover:(scale-101) active:(scale-103)';
}
</style>
