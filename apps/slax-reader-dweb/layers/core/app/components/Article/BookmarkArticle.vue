<template>
  <div class="bookmark-article snapshot" ref="bookmarkArticle" :class="{ [articleStyle]: true }">
    <header class="article-header">
      <SnapshotArticleSource v-if="detail.target_url" :url="detail.target_url" />
      <div class="article-divider" />
      <h1 class="article-title">{{ title }}</h1>
      <div class="article-info">
        <span v-if="detail.byline" class="article-author">{{ detail.byline }}</span>
        <time class="article-date">{{ dateString }}</time>
        <button class="article-url" @click="websiteClick">{{ urlString }}</button>
      </div>
      <BookmarkTags class="article-tags" :bookmarkId="bookmarkId || 0" :tags="detail.tags" :readonly="!allowTagged" />
    </header>
    <!-- 保留 .article-detail ref + articleStyle class，processors 管道 / mark 绘制依赖 -->
    <div class="article-detail article-body" ref="articleDetail" :class="{ [articleStyle]: true }">
      <div class="html-text" lang="en" v-html="articleHTML"></div>
    </div>
    <SnapshotArticleFooter />
  </div>
</template>

<script lang="ts" setup>
import BookmarkTags from '#layers/core/app/components/BookmarkTags.vue'
import SnapshotArticleFooter from '#layers/core/app/components/Snapshot/SnapshotArticleFooter.vue'
import SnapshotArticleSource from '#layers/core/app/components/Snapshot/SnapshotArticleSource.vue'

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

// shallowRef：ArticleSelection 实例自身管理内部响应性，不需要深响应代理
const articleSelectionRef = shallowRef<DwebArticleSelection | null>(null)
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
    articleSelectionRef.value?.closeMonitor()
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
  if (!articleSelectionRef.value && bookmarkArticle.value && articleDetail.value) {
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

    articleSelectionRef.value = new DwebArticleSelection(config, dependencies, modal)
  }

  if (!articleSelectionRef.value) {
    return
  }

  const promise = []
  if ('marks' in detail.value) {
    promise.push(articleSelectionRef.value?.drawMark(detail.value.marks))
  } else if (props.marks) {
    promise.push(articleSelectionRef.value?.drawMark(props.marks))
  }

  if (promise.length > 0 && !articleSelectionRef.value.isMonitoring) {
    articleSelectionRef.value?.startMonitor()
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
  articleSelectionRef.value?.findQuote(quote)
}

defineExpose({
  findQuote,
  articleSelection: articleSelectionRef
})
</script>

<style lang="scss" scoped>
.bookmark-article.snapshot {
  --style: relative;
  // 正文容器宽度与 padding（snapshot §2.2）
  width: var(--slax-content-w);
  max-width: 100%;
  padding: 76px 24px 0;

  @media (max-width: 768px) {
    padding: 64px 16px 0;
  }

  // 清零旧 DetailLayout .detail-container mt-32px 叠加
  :deep(.detail-container) {
    margin-top: 0;
  }
}

.article-header {
  --style: flex flex-col gap-12px;
}

.article-divider {
  --style: w-full h-1px;
  background: var(--slax-border);
}

.article-title {
  font-family: var(--slax-font-serif);
  font-size: var(--slax-fs-display);
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: var(--slax-text);
  --style: m-0;
}

.article-info {
  --style: flex items-center flex-wrap gap-x-12px gap-y-4px;

  .article-author {
    font-size: var(--slax-fs-meta);
    color: var(--slax-text-muted);
  }

  .article-date {
    font-size: var(--slax-fs-aux);
    font-weight: 300;
    color: var(--slax-text-light);
  }

  .article-url {
    --style: 'text-aux cursor-pointer hover:underline overflow-hidden whitespace-nowrap text-ellipsis max-w-200px';
    color: var(--slax-text-light);
  }
}

.article-tags {
  --style: mt-4px;
}

// .article-body 是 snapshot 样式钩子，叠加在 .article-detail 上（不替换）
.article-detail.article-body {
  // 清零旧 mt-24px，由容器 padding 控制间距
  margin-top: 0 !important;
  padding-top: 32px;

  *::selection {
    --style: 'bg-#ffd99933';
  }

  // 正文排版
  :deep(.html-text) {
    p {
      font-size: var(--slax-fs-body);
      line-height: 1.85;
    }

    h2 {
      font-family: var(--slax-font-serif);
      font-size: var(--slax-fs-h2);
      font-weight: 500;
      margin-top: 48px;
    }

    img {
      border-radius: var(--slax-radius-sm);
      margin: 32px auto;
    }

    blockquote {
      border-left: 2px solid var(--slax-accent-soft);
      padding: 4px 20px;
      color: var(--slax-text-muted);
      font-style: italic;
    }

    .img-caption {
      font-size: var(--slax-fs-aux);
      font-weight: 300;
      color: var(--slax-text-light);
      text-align: center;
    }
  }

  // 划线样式 token 化（普通详情页生效路径；iframe 路径走 mark.css）
  &:deep(slax-mark) {
    color: inherit;
    transition: all var(--slax-dur-normal);
  }

  &:deep(slax-mark.stroke) {
    cursor: pointer;
    text-decoration: underline solid;
    text-decoration-color: color-mix(in srgb, var(--slax-accent) 50%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
    box-decoration-break: clone;
  }

  &:deep(slax-mark.self-stroke) {
    cursor: pointer;
    text-decoration: underline solid;
    text-decoration-color: color-mix(in srgb, var(--slax-accent) 75%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
    box-decoration-break: clone;
  }

  &:deep(slax-mark.comment) {
    cursor: pointer;
    text-decoration: underline dashed;
    text-decoration-color: color-mix(in srgb, var(--slax-accent) 50%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
    box-decoration-break: clone;
  }

  &:deep(slax-mark:hover) {
    text-decoration-color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }

  &:deep(slax-mark.highlighted) {
    --style: 'bg-#FCF4E8';
  }

  &:deep(slax-mark:has(img).stroke),
  &:deep(slax-mark:has(img).comment) {
    border: 1.5px solid var(--slax-accent);
    text-decoration: none;
  }

  &:deep(slax-mark:has(img)) {
    --style: p-0px relative inline-block;

    &::after {
      content: '···';
      --style: absolute h-25px w-25px px-0px rounded-full -right-5px -top-5px line-height-25px text-txt-btn text-meta text-align-center transition-transform duration-normal;
      background-color: color-mix(in srgb, var(--slax-accent) 93%, transparent);
    }

    slax-mark {
      --style: '!p-0';
      &::after {
        --style: content-none;
      }
    }
  }

  &:deep(slax-mark slax-mark) {
    --style: '!border-none';
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
