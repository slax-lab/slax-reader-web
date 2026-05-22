<template>
  <div class="bookmark-article" ref="bookmarkArticle" :class="{ articleStyle }">
    <div class="title">
      <span class="text">{{ title }}</span>
    </div>
    <div class="desc">
      <button
        v-if="allowStarred"
        class="star bg-[length:13.5px_13.5px] bg-[url('@images/tiny-star-disable.png')] bg-center"
        :class="{ enabled: isStarred }"
        @click="e => starBookmark(e, !isStarred)"
      ></button>
      <span class="text" v-if="detail.byline">{{ detail.byline }}</span>
      <span class="text">{{ dateString }}</span>
      <i class="seperator"></i>
      <button @click="websiteClick">{{ `${urlString}` }}</button>
    </div>
    <div class="tags">
      <BookmarkTags :bookmarkId="bookmarkId || 0" :tags="detail.tags" :readonly="!allowTagged" />
    </div>
    <div class="article-detail" ref="articleDetail" :class="{ [articleStyle]: true }">
      <div class="html-text" lang="en" v-html="articleHTML"></div>
    </div>
    <div class="end">
      <div class="line"></div>
      <span class="ml-2">{{ $t('page.bookmarks_detail.no_more') }}</span>
      <div class="line"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookmarkTags from '#layers/core/app/components/BookmarkTags.vue'

import { urlHttpString } from '@commons/utils/string'

import 'katex/dist/katex.css'
import { registerComponents } from './CEComponents'
import type { WebProcessorContext } from './processors'
import {
  AnchorProcessor,
  ArticleStyle,
  DetailsProcessor,
  DOMPipeline,
  IFrameProcessor,
  ImageProcessor,
  ListProcessor,
  PhotoSwipeProcessor,
  SpanProcessor,
  SvgProcessor,
  TweetProcessor,
  VideoProcessor,
  WechatHeaderProcessor,
  WechatVideoProcessor
} from './processors'
import { DwebBookmarkProvider, DwebEnvironmentAdapter, DwebHttpClient, DwebI18nService, DwebToastService, DwebUserProvider } from './Selection/adapters'
import { DwebArticleSelection } from './Selection/DwebArticleSelection'
import { MarkModal } from './Selection/modal'
import { type MarkDetail, MarkType } from '@commons/types/interface'
import type { SelectionConfig } from '@slax-reader/selection'
import { formatDate } from '@vueuse/core'
import type { QuoteData } from '#layers/core/app/components/Chat/type'
import CursorToast from '#layers/core/app/components/CursorToast'
import Preview from '#layers/core/app/components/ImagePreview'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useArticleDetail } from '#layers/core/app/composables/bookmark/useArticle'

const route = useRoute()
const props = defineProps({
  detail: {
    type: Object as PropType<BookmarkArticleDetail>,
    required: true
  },
  marks: {
    type: Object as PropType<MarkDetail>,
    required: false
  }
})

const emits = defineEmits(['screenLockUpdate', 'bookmarkUpdate', 'chatBotQuote'])

const { t } = useI18n()
const { detail } = toRefs(props)
const bookmarkArticle = ref<HTMLDivElement>()
const articleDetail = ref<HTMLDivElement>()
const isHandledHTML = ref(false)
const extraListeners: (() => void)[] = []

const { bookmarkId, shareCode, title, isStarred, allowStarred, allowAction, allowTagged, bookmarkUserId, updateStarred } = useArticleDetail(detail)

const collection = computed(() => {
  try {
    if (typeof (globalThis as any).isCollectionBookmarkDetail === 'function' && (globalThis as any).isCollectionBookmarkDetail(detail.value)) {
      return {
        code: (detail.value as any).collection_info.collection_code,
        cb_id: (detail.value as any).collection_info.cb_id
      }
    }
  } catch (error) {}
  return undefined
})
const articleStyle = computed(() => {
  const content = props.detail.content || ''
  if (content.indexOf('<slax-photo-swipe-topic>') === 0) {
    return ArticleStyle.PhotoSwipeTopic
  } else if (content.indexOf('<div class=\"tweet\">') === 0) {
    return ArticleStyle.Twitter
  }

  return ArticleStyle.Default
})

let articleSelection: DwebArticleSelection | null = null

watch(
  () => props.marks,
  value => {
    if (value && isHandledHTML.value) {
      handleDrawMark()
    }
  }
)

const dateString = computed(() => {
  const date = detail.value.published_at ?? detail.value.created_at ?? ''
  if (!date || date.length === 0) {
    return '--'
  }

  return formatDate(new Date(date), 'YYYY-MM-DD')
})

const urlString = computed(() => {
  return urlHttpString(detail.value.target_url)
})

const articleHTML = computed(() => {
  return detail.value.content?.replace(/<img/g, '<img loading="lazy"') || ''
})

onMounted(() => {
  registerComponents()

  nextTick(() => {
    handleHTML().then(() => {
      handleDrawMark()
    })
  })
})

onUnmounted(() => {
  try {
    articleSelection?.closeMonitor()
    extraListeners.forEach(listener => listener())
  } finally {
  }
})

const jumpToHighLight = () => {
  const highlightUid = route.query.highlight as string
  if (!highlightUid) return

  const marks = detail.value.marks || props.marks || []
  let mark = marks.mark_list?.find(item => item.uuid === highlightUid)
  if (!mark) return

  if (mark.type === MarkType.REPLY) {
    const rootUid = mark.root_uid
    mark = marks.mark_list?.find(item => item.uuid === rootUid)
    if (!mark) return
  }

  for (const source of mark.source) {
    if (source.type === 'image') {
      const paths = source.path.split('>')
      const tailIdx = paths.length - 1
      const newPath = [...paths.slice(0, tailIdx), ' slax-mark ', paths[tailIdx]]
      source.path = newPath.join('>')
    }

    const element = document.querySelector(source.path)
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'center' })
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)

      break
    }
  }

  navigateTo({ path: route.path, query: {} })
}

const websiteClick = () => {
  window.open(`${urlString.value}`)
}

const handleHTML = async () => {
  const container = articleDetail.value
  if (!container) return

  const context: WebProcessorContext = {
    container,
    url: new URL(detail.value.target_url),
    articleStyle: articleStyle.value,
    callbacks: {
      screenLockUpdate: locked => emits('screenLockUpdate', locked),
      showImagePreview: opts => Preview.showImagePreview(opts),
      websiteClick
    },
    cleanups: extraListeners
  }

  const pipeline = new DOMPipeline()
    .register(new WechatHeaderProcessor())
    .register(new ImageProcessor())
    .register(new SvgProcessor())
    .register(new ListProcessor())
    .register(new AnchorProcessor())
    .register(new VideoProcessor())
    .register(new IFrameProcessor())
    .register(new WechatVideoProcessor())
    .register(new DetailsProcessor())
    .register(new SpanProcessor())
    .register(new PhotoSwipeProcessor())
    .register(new TweetProcessor())

  await pipeline.run(context)

  isHandledHTML.value = true
}

const handleDrawMark = async () => {
  if (!articleSelection && bookmarkArticle.value && articleDetail.value) {
    const config = {
      shareCode: shareCode || '',
      bookmarkId: bookmarkId || 0,
      collection: collection?.value,
      allowAction: allowAction.value,
      ownerUserId: bookmarkUserId.value,
      containerDom: bookmarkArticle.value,
      monitorDom: articleDetail.value,
      postQuoteDataHandler: (data: QuoteData) => {
        emits('chatBotQuote', data)
      }
    } as SelectionConfig

    const dependencies = {
      userProvider: new DwebUserProvider(),
      httpClient: new DwebHttpClient(),
      toastService: new DwebToastService(),
      i18nService: new DwebI18nService(),
      environmentAdapter: new DwebEnvironmentAdapter(),
      bookmarkProvider: new DwebBookmarkProvider({
        bookmarkId: bookmarkId || 0,
        shareCode: shareCode || '',
        collection: collection?.value,
        ownerUserId: bookmarkUserId.value
      }),
      refFactory: ref,
      getMarkType: (type: 'comment' | 'reply' | 'line') => {
        if (type === 'comment') {
          return !!config.iframe ? MarkType.ORIGIN_COMMENT : MarkType.COMMENT
        } else if (type === 'reply') {
          return MarkType.REPLY
        } else {
          return !!config.iframe ? MarkType.ORIGIN_LINE : MarkType.LINE
        }
      }
    }

    const modal = new MarkModal(config)

    articleSelection = new DwebArticleSelection(config, dependencies, modal)
  }

  if (!articleSelection) {
    return
  }

  const promise = []
  if ('marks' in detail.value) {
    promise.push(articleSelection?.drawMark(detail.value.marks))
  } else if (props.marks) {
    promise.push(articleSelection?.drawMark(props.marks))
  }

  if (promise.length > 0 && !articleSelection.isMonitoring) {
    articleSelection?.startMonitor()
  }

  await Promise.all(promise).then(() => {
    jumpToHighLight()
  })
}

const starBookmark = async (event: MouseEvent, isStar: boolean) => {
  if (!bookmarkId || !updateStarred) {
    return
  }

  try {
    await updateStarred(isStar)

    postChannelMessage('star', { id: bookmarkId, cancel: !isStar })

    CursorToast.showToast({
      text: t(!isStar ? 'common.tips.unstar_success' : 'common.tips.star_success'),
      trackDom: event.target as HTMLElement
    })

    emits('bookmarkUpdate', detail.value)
  } catch (e) {
    console.log(e)
    Toast.showToast({
      text: t('common.tips.operate_failed'),
      type: ToastType.Error
    })
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection?.findQuote(quote)
}

defineExpose({
  findQuote
})
</script>

<style lang="scss" scoped>
.bookmark-article {
  --style: relative -mb-10px;

  .title {
    --style: text-24px text-txt font-semibold line-height-36px line-clamp-2;
  }

  .desc {
    --style: flex items-center mt-16px;

    .star {
      --style: shrink-0 -mt-1px w-16px h-16px;

      &.enabled {
        background-image: url('@images/tiny-star-enable.png');
      }
    }
    .text {
      --style: 'text-(14px txt-light ellipsis) line-height-20px not-first:ml-10px shrink-0 overflow-hidden max-w-200px whitespace-nowrap';
    }

    .seperator {
      --style: 'mx-8px w-1px h-10px bg-border flex-shrink-0';
    }

    button {
      --style: 'text-(14px txt-light ellipsis) line-height-20px hover:(underline underline-txt-light) shrink-1 overflow-hidden whitespace-nowrap';
    }
  }

  .tags {
    --style: mt-16px;
  }

  .article-detail {
    *::selection {
      // bg-#ffd99933 文本选区暖黄高亮（与 mark 高亮系同源），保留
      --style: 'bg-#ffd99933';
    }

    &:deep(slax-mark) {
      --style: color-inherit relative transition-colors duration-250;

      &.comment {
        --style: 'cursor-pointer';
        border-bottom: 1.5px dashed #f6af69 !important;
      }

      &.stroke {
        --style: 'cursor-pointer';
        border-bottom: 1.5px dashed #f6af69 !important;
      }

      &.self-stroke {
        border-bottom: 1.5px solid #f6af69 !important;
      }

      &.highlighted {
        // bg-#FCF4E8 mark 高亮浅米色底（与 mark.css 同源），保留
        --style: 'bg-#FCF4E8';
      }

      &:has(img) {
        --style: p-0px relative inline-block;
        &.comment {
          border: 2px dashed #f6af69 !important;
        }

        &.stroke {
          border: 2px solid #f6af69 !important;
        }

        &::after {
          content: '···';
          // bg-#f6af69ee mark 评论小圆点暖橙底（与 mark 系强调色同源），保留
          --style: absolute h-25px w-25px px-0px rounded-full bg-#f6af69ee -right-5px -top-5px line-height-25px text-txt-btn text-15px text-align-center transition-transform
            duration-250;
        }

        slax-mark {
          --style: '!p-0';
          &::after {
            --style: content-none;
          }
        }
      }

      slax-mark {
        --style: '!border-none ';
      }
    }
  }

  .end {
    --style: text-(12px txt-light) select-none py-60px flex-center;
    .line {
      // #a8b1cd3d 是带蓝调的半透明分隔线，与 token border（黑色 8% 透明）质感不同，保留
      --style: w-36px h-1px bg-#a8b1cd3d;
    }

    span {
      --style: mx-12px;
    }
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
@use '#layers/core/styles/article/index.scss' as article;
@use 'github-syntax-light/lib/github-light.css' as *;

/* 该类下所有样式都是使用入侵的形式去调整，设置时可以根据下方注释的分类来进行对应设置 */

@mixin style($type) {
  @if $type == 'default' {
    @include article.article;
  } @else if $type == 'twitter' {
    @include article.twitter;
  } @else if $type == 'photo-swipe-topic' {
    @include article.photo-swipe-topic;
  } @else {
    @include article.article;
  }
}

.article-detail {
  --style: mt-24px hyphens-auto;
  @include article.reset;

  &.default {
    @include style('default');
  }

  &.twitter {
    @include style('twitter');
  }

  &.photo-swipe-topic {
    @include style('photo-swipe-topic');
  }
}
</style>
