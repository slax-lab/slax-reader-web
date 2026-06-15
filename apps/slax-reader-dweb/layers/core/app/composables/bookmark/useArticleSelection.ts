// BookmarkArticle 划线/评论重逻辑唯一来源
// 行为差异经 adapters 注入，默认=现状
import { computed, type Ref, ref, shallowRef, toValue, watch } from 'vue'

import { urlHttpString } from '@commons/utils/string'

import { type MarkDetail, MarkType } from '@commons/types/interface'
import type { SelectionConfig } from '@slax-reader/selection'
import {
  AnchorProcessor,
  type ArticleStyle,
  ClassIsolationProcessor,
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
  type WebProcessorContext,
  WechatHeaderProcessor,
  WechatVideoProcessor
} from '#layers/core/app/components/Article/processors'
import {
  DwebBookmarkProvider,
  DwebEnvironmentAdapter,
  DwebHttpClient,
  DwebI18nService,
  DwebToastService,
  DwebUserProvider
} from '#layers/core/app/components/Article/Selection/adapters'
import { DwebArticleSelection } from '#layers/core/app/components/Article/Selection/DwebArticleSelection'
import type { ArticleSelectionAdapters } from '#layers/core/app/components/Article/Selection/injection'
import { MarkModal } from '#layers/core/app/components/Article/Selection/modal'
import type { QuoteData } from '#layers/core/app/components/Chat/type'
import Preview from '#layers/core/app/components/ImagePreview'

export interface UseArticleSelectionParams {
  detail: Ref<BookmarkArticleDetail>
  containerDom: Ref<HTMLDivElement | undefined>
  monitorDom: Ref<HTMLDivElement | undefined>
  marks: Ref<MarkDetail | undefined>
  /** 门控：false 不画，默认 true */
  ready: Ref<boolean>
  /** HTML 管道用的文章样式 */
  articleStyle: Ref<ArticleStyle>
  /** 行为注入，默认空=现状 */
  adapters: ArticleSelectionAdapters
  onChatBotQuote: (data: QuoteData) => void
  onScreenLockUpdate: (locked: boolean) => void
  // 组件传入一次，避免重复实例化
  // 返回可能 undefined，故全部可选
  bookmarkId?: number
  shareCode?: string
  bookmarkUid?: string
  allowAction: Ref<boolean>
  // snapshot user_id 可能是 hash 串，故联合 string
  bookmarkUserId: Ref<number | string>
}

export function useArticleSelection(p: UseArticleSelectionParams) {
  const route = useRoute()

  // shallowRef：实例自管响应性
  const articleSelectionRef = shallowRef<DwebArticleSelection | null>(null)
  // pipeline 跑完置 true，同原 isHandledHTML
  const htmlReady = ref(false)
  const isHandledHTML = htmlReady
  // processor 清理回调，unmount 时清
  const extraListeners: (() => void)[] = []

  // 复制 upstream 原逻辑，不简化
  const collection = computed(() => {
    try {
      if (typeof (globalThis as any).isCollectionBookmarkDetail === 'function' && (globalThis as any).isCollectionBookmarkDetail(p.detail.value)) {
        return {
          code: (p.detail.value as any).collection_info.collection_code,
          cb_id: (p.detail.value as any).collection_info.cb_id
        }
      }
    } catch (error) {}
    return undefined
  })

  // 覆写点：默认回退现状
  const effAllowAction = computed(() => p.adapters.allowActionOverride ?? p.allowAction.value)
  const effOwnerUserId = computed(() => toValue(p.adapters.ownerUserId) ?? p.bookmarkUserId.value)

  const urlString = computed(() => urlHttpString(p.detail.value.target_url))
  const websiteClick = () => {
    window.open(`${urlString.value}`)
  }

  // HTML 管道：客户端 onMounted 后调用
  const handleHTML = async () => {
    const container = p.monitorDom.value
    if (!container) return

    const context: WebProcessorContext = {
      container,
      url: new URL(p.detail.value.target_url),
      articleStyle: p.articleStyle.value,
      callbacks: {
        screenLockUpdate: locked => p.onScreenLockUpdate(locked),
        showImagePreview: opts => Preview.showImagePreview(opts),
        websiteClick
      },
      cleanups: extraListeners
    }

    const pipeline = new DOMPipeline()
      // 最前：前缀化外来 class，隔离 UnoCSS
      .register(new ClassIsolationProcessor())
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

    htmlReady.value = true
  }

  const handleDrawMark = async () => {
    if (!p.ready.value) return // localReady 门控，默认 true 无影响
    if (!articleSelectionRef.value && p.containerDom.value && p.monitorDom.value) {
      const config = {
        shareCode: p.shareCode || '',
        bookmarkId: p.bookmarkId || 0,
        collection: collection.value,
        allowAction: effAllowAction.value,
        ownerUserId: effOwnerUserId.value, // 取初始化时刻值，后不更新
        containerDom: p.containerDom.value,
        monitorDom: p.monitorDom.value,
        postQuoteDataHandler: (data: QuoteData) => {
          p.onChatBotQuote(data)
        }
      } as SelectionConfig

      const dependencies = {
        userProvider: new DwebUserProvider(),
        httpClient: p.adapters.httpClient?.() ?? new DwebHttpClient(), // factory 调用拿实例
        toastService: new DwebToastService(),
        i18nService: new DwebI18nService(),
        environmentAdapter: new DwebEnvironmentAdapter(),
        bookmarkProvider: new DwebBookmarkProvider({
          bookmarkId: p.bookmarkId || 0,
          bookmarkUid: p.bookmarkUid || undefined,
          shareCode: p.shareCode || '',
          collection: collection.value,
          // snapshot 下可能是 hash 串
          // 仅边界 cast 满足 number 类型
          ownerUserId: effOwnerUserId.value as number | undefined
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

    // 忠实复制现状，不做优化回退
    // props→props.marks；默认→detail 原 if/else
    const promise = []
    if (p.adapters.markSource === 'props') {
      promise.push(articleSelectionRef.value?.drawMark(p.marks.value ?? { mark_list: [], user_list: {} }))
    } else if ('marks' in p.detail.value) {
      promise.push(articleSelectionRef.value?.drawMark((p.detail.value as any).marks))
    } else if (p.marks.value) {
      promise.push(articleSelectionRef.value?.drawMark(p.marks.value))
    }

    if (promise.length > 0 && !articleSelectionRef.value.isMonitoring) {
      articleSelectionRef.value?.startMonitor()
    }

    await Promise.all(promise).then(() => {
      jumpToHighLight()
    })
  }

  // upstream 原样搬入，与现状逐字等价
  const jumpToHighLight = () => {
    const highlightUid = route.query.highlight as string
    if (!highlightUid) return

    const marks = p.detail.value.marks || p.marks.value || []
    let mark = (marks as MarkDetail).mark_list?.find(item => item.uuid === highlightUid)
    if (!mark) return

    if (mark.type === MarkType.REPLY) {
      const rootUid = mark.root_uid
      mark = (marks as MarkDetail).mark_list?.find(item => item.uuid === rootUid)
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

  // 三个 watcher 带守卫，避免重复触发
  // marks / ready / htmlReady 各触发 drawMark
  watch(
    () => p.marks.value,
    value => {
      if (value && isHandledHTML.value) handleDrawMark()
    }
  )
  watch(
    () => p.ready.value,
    ready => {
      if (ready && isHandledHTML.value) handleDrawMark()
    }
  )
  watch(htmlReady, ready => {
    if (ready) handleDrawMark()
  })

  const findQuote = (quote: QuoteData) => {
    articleSelectionRef.value?.findQuote(quote)
  }

  const cleanup = () => {
    try {
      articleSelectionRef.value?.closeMonitor()
      extraListeners.forEach(listener => listener())
    } finally {
    }
  }

  return { articleSelectionRef, htmlReady, handleHTML, handleDrawMark, findQuote, cleanup }
}
