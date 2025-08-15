<template>
  <div class="ai-overview">
    <div class="header">
      <div class="title">{{ bookmarkBriefInfo.title }}</div>
    </div>
    <div class="tags">
      <div class="i-svg-spinners:90-ring w-24px color-#f4c982" v-if="isLoading && tags.length === 0"></div>
      <BookmarkTags v-else :bookmark-id="bookmarkId" :tags="tags" />
    </div>
    <div class="loading" v-if="isLoading">
      <div class="placeholder">
        <div class="row" v-for="(_, index) in Array.from({ length: 3 })" :key="index"></div>
      </div>
    </div>
    <div class="overview-content" v-if="!isLoading && overviewContent.length > 0">
      <div class="text-content" ref="textContainer">
        <span>{{ $t('component.overview.text_content_title') }}</span>
        <MarkdownText class="mt-24px" :text="overviewContent" v-resize="resizeHandler" />
      </div>
      <div class="loading-bottom" ref="loadingBottom" v-if="!isDone && isLoading">
        <DotLoading />
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
import Toast, { ToastType } from './Toast'
import MarkdownText from './Markdown/MarkdownText.vue'
import DotLoading from './DotLoading.vue'
import { Resize } from '@commons/utils/directive'

type OverviewSocketData =
  | {
      type: 'progress' | 'done'
      data: {
        overview?: string
        tags?: string
        id?: string
      }
    }
  | {
      type: 'error'
      message: string
    }

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
const isDone = ref(false)
const textContainer = ref<HTMLDivElement>()
const loadingBottom = ref<HTMLDivElement>()
const vResize = Resize
const tags = ref<BookmarkTag[]>(props.bookmarkBriefInfo.tags)
const graphContents = ref<string[]>([])
const bookmarkId = computed(() => props.bookmarkBriefInfo.bookmark_id)
const overviewContent = ref(props.bookmarkBriefInfo.overview || '')

watch(
  () => props.isAppeared,
  value => {
    if (value) {
      if (overviewContent.value.length === 0 && !isDone.value && !isLoading.value) {
        loadOverview()
      }
    }
  }
)

const queryOverview = async (refresh: boolean, callback: (text: string, tagId: number, type: 'tags' | 'overview' | '', done: boolean, error?: Error) => void) => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true
  const requestCallback = await request.stream({
    url: RESTMethodPath.BOOKMARK_OVERVIEW,
    method: RequestMethodType.post,
    body: {
      bookmark_id: bookmarkId.value,
      force: refresh
    }
  })

  let errorCacheText = ''

  requestCallback &&
    requestCallback((text: string, done: boolean) => {
      try {
        let parsedJsons = []
        try {
          parsedJsons = parseConcatenatedJson(errorCacheText + text)
        } catch (e) {
          console.log('need concat', text)
          errorCacheText = text

          if (done) {
            callback('', 0, '', true)
          }

          return
        }

        if (parsedJsons.length === 0) {
          callback('', 0, '', true)
        } else {
          for (let i = 0; i < parsedJsons.length; i++) {
            const res = parsedJsons[i]
            if (res.type === 'error') {
              throw new Error(res.message)
            } else if (res.type === 'done') {
              callback('', 0, '', true)
            } else {
              const type = res.data.overview ? 'overview' : res.data.tags ? 'tags' : ''
              const contentText = (type === 'overview' ? res.data.overview : type === 'tags' ? res.data.tags : '') + ''
              callback(contentText, 0, type, i === parsedJsons.length - 1 ? done : false)
            }
          }
        }

        isLoading.value = overviewContent.value.length === 0
        if (done) {
          isDone.value = true
          isLoading.value = false
        }
      } catch (error) {
        console.log(error, text)

        Toast.showToast({
          text: `${error}`,
          type: ToastType.Error
        })

        isLoading.value = false
        isDone.value = true

        callback('', 0, '', isDone.value)
      }
    })
}

const loadOverview = (options?: { refresh: boolean }) => {
  let step = 0
  const timeInterval = setInterval(() => {
    step += 1
  }, 2000)
  let executeStep = 0
  let result = ''
  queryOverview(options?.refresh || false, (text: string, tagId: number, type: 'tags' | 'overview' | '', done: boolean) => {
    if (type === 'tags') {
      if (!tags.value.find(tag => tag.id === tagId)) {
        tags.value.push({
          id: tagId,
          name: text,
          show_name: text,
          system: true
        })
      }
    } else {
      result += text
    }

    let needUpdateText = done || executeStep < step
    if (done) {
      clearInterval(timeInterval)
    } else if (executeStep < step) {
      executeStep = step
    }

    if (needUpdateText) {
      overviewContent.value = result
    }
  })
}

const parseConcatenatedJson = (inputString: string) => {
  const trimmedString = inputString.trim()
  if (!trimmedString) {
    return []
  }

  const parts = trimmedString.split('}\n{')
  const fixedParts = parts.map((part, index) => {
    if (index === 0 && parts.length > 1) {
      return part + '}'
    } else if (index === parts.length - 1 && parts.length > 1) {
      return '{' + part
    } else if (parts.length > 1) {
      return '{' + part + '}'
    }

    return part
  })

  const arrayOfObjects = fixedParts.map(str => JSON.parse(str)) as OverviewSocketData[]
  return arrayOfObjects
}

const resizeHandler = (_: HTMLDivElement, size: DOMRectReadOnly) => {
  const view = textContainer.value
  if (!view || !(view instanceof HTMLElement)) {
    return
  }

  view.style.height = `${size.height + 20}px`
  view.style.transition = `height ${isDone.value ? 0 : 0.25}s ease-in-out`

  const loadingEle = loadingBottom.value
  if (!loadingEle || !size || !(loadingEle instanceof HTMLElement)) {
    return
  }

  loadingEle.style.top = `${size.height}px`
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
    --style: relative;

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

      .markdown-text {
        &:deep(*) {
          --style: text-#ffffffe6 text-16px line-height-24px;
        }

        &:deep(ol) {
          --style: mt-0;
        }

        &:deep(p + p) {
          --style: mt-24px;
        }
      }
    }

    .loading-bottom {
      --style: 'absolute left-0 top-full left-0 transition-top duration-250';
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
