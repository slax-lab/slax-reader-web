<template>
  <div class="ai-overview">
    <div class="header">
      <div class="title">{{ bookmarkBriefInfo.title }}</div>
    </div>
    <div class="loading" v-if="isLoading">
      <div class="placeholder">
        <div class="row" v-for="(_, index) in Array.from({ length: 3 })" :key="index"></div>
      </div>
    </div>
    <div class="tags">
      <div class="i-svg-spinners:90-ring w-24px color-#FFFFFF99" v-if="isTagLoading"></div>
      <BookmarkTags v-else-if="tags !== null" :bookmark-id="bookmarkId" :tags="tags" />
    </div>
    <div class="overview-content" v-if="!isLoading">
      <div class="text-content">
        <span>{{ $t('component.overview.text_content_title') }}</span
        ><span>{{ content }}</span>
      </div>
      <div class="graph-content">
        <div class="content-rows" v-for="(item, index) in graphContents" :key="index">
          <div class="graph-prefix"></div>
          <span> {{ item }} </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { BookmarkBriefDetail, BookmarkTag } from '@commons/types/interface'
import BookmarkTags from './BookmarkTags.vue'
import { RESTMethodPath } from '@commons/types/const'
import { RequestMethodType } from '@commons/utils/request'

const props = defineProps({
  isAppeared: {
    required: false,
    type: Boolean
  },
  bookmarkBriefInfo: {
    type: Object as PropType<BookmarkBriefDetail>,
    required: true
  }
})

const isLoading = ref(false)
const isTagLoading = ref(false)
const tags = ref<BookmarkTag[] | null>(null)
const graphContents = ref<string[]>([])
const bookmarkId = computed(() => props.bookmarkBriefInfo.bookmark_id)

const content = computed(() => {
  return props.bookmarkBriefInfo.overview
})

watch(
  () => props.isAppeared,
  value => {
    if (value && tags.value === null) {
      requestTags()
    }
  },
  {
    flush: 'sync'
  }
)

const requestTags = async () => {
  if (isTagLoading.value || !bookmarkId.value) return

  isTagLoading.value = true
  try {
    const res = await request.get<BookmarkTag[]>({
      url: RESTMethodPath.BOOKMARK_TAGS,
      method: RequestMethodType.get,
      query: {
        bookmark_id: bookmarkId.value
      }
    })
    if (!res) throw new Error('load tags failed')

    tags.value = res
  } finally {
    isTagLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.ai-overview {
  --style: px-20px py-30px;

  .header {
    .title {
      --style: text-(20px #ffffffe6) font-semibold line-height-28px;
    }
  }

  .loading {
    --style: select-none;

    .placeholder {
      --style: mt-24px w-full flex flex-col;

      .row {
        --style: w-full h-16px rounded-1 animate-pulse;
        --style: 'not-first:mt-10px bg-gradient-to-r from-#f5f5f3 to-#f5f5f399 dark:(from-#ffffff33 to-#ffffff11)';
      }
    }
  }

  .tags {
    --style: mt-24px;
  }

  .overview-content {
    .text-content {
      --style: mt-24px whitespace-pre-line overflow-hidden;

      span {
        --style: text-16px line-height-24px;

        &:nth-child(1) {
          --style: text-#999999ff;
        }

        &:nth-child(2) {
          --style: text-#FFFFFFCC;
        }
      }
    }

    .graph-content {
      --style: mt-24px w-full flex flex-col;
      .content-rows {
        --style: relative flex items-center w-full py-7px;

        .graph-prefix {
          --style: w-6px h-full absolute top-0 left-0;

          &::before {
            --style: content-empty absolute top-1/2 left-1/2 -translate-1/2 w-6px h-6px rounded-full bg-#262626FF border-(1.5px solid #ffffff3d) z-2;
          }

          &::after {
            --style: content-empty absolute top-0 left-1/2 -translate-x-1/2 w-1px h-full bg-#5A5A5A4D;
          }
        }

        &:first-child {
          .graph-prefix::after {
            --style: top-1/2 h-1/2;
          }
        }

        &:last-child {
          .graph-prefix::after {
            --style: h-1/2;
          }
        }

        span {
          --style: ml-18px text-(15px #ffffff99);
        }
      }
    }
  }
}
</style>
