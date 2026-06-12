// BookmarkArticle 的「划线/评论」重逻辑唯一来源。
// 抽取自 BookmarkArticle.vue（upstream 基线）的 selection 初始化 + HTML 管道 + 绘制 + 生命周期，
// 使 fork 不再整份拷贝组件。行为差异（httpClient / 权限 / ownerUserId / marks 来源）全部经 adapters 注入，
// 默认值 = 现状，保证上游消费页面零变化。
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
  /** 门控：false 时不画。非 LF 默认 true，行为同现状 */
  ready: Ref<boolean>
  /** 供 HTML 管道用的文章样式（default / twitter / photo-swipe-topic） */
  articleStyle: Ref<ArticleStyle>
  /** 行为依赖注入（来自 inject，默认空对象 = 现状） */
  adapters: ArticleSelectionAdapters
  onChatBotQuote: (data: QuoteData) => void
  onScreenLockUpdate: (locked: boolean) => void
  // useArticleDetail 由组件调用一次后传入（避免重复实例化）。
  // bookmarkId/shareCode/bookmarkUid 真实返回可能为 undefined（useArticle.ts:25-28），全部可选。
  bookmarkId?: number
  shareCode?: string
  bookmarkUid?: string
  allowAction: Ref<boolean>
  // snapshot detail 的 user_id 可能是 hash 串，故联合 string（与 useBookmarkArticleRelative.bookmarkUserId 返回一致）
  bookmarkUserId: Ref<number | string>
}

export function useArticleSelection(p: UseArticleSelectionParams) {
  const route = useRoute()

  // shallowRef：ArticleSelection 实例自身管理内部响应性，不需要深响应代理
  const articleSelectionRef = shallowRef<DwebArticleSelection | null>(null)
  // handleHTML() 完成后置 true（DOM pipeline 跑完）；语义同原 isHandledHTML
  const htmlReady = ref(false)
  const isHandledHTML = htmlReady
  // DOM processor 注册的清理回调，归本 composable 所有（unmount 时连同 closeMonitor 一并清）
  const extraListeners: (() => void)[] = []

  // collection：忠实复制 upstream 原逻辑（globalThis.isCollectionBookmarkDetail 守卫 + try/catch），不简化
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

  // 覆写点：默认回退现状（allowAction / bookmarkUserId）
  const effAllowAction = computed(() => p.adapters.allowActionOverride ?? p.allowAction.value)
  const effOwnerUserId = computed(() => toValue(p.adapters.ownerUserId) ?? p.bookmarkUserId.value)

  const urlString = computed(() => urlHttpString(p.detail.value.target_url))
  const websiteClick = () => {
    window.open(`${urlString.value}`)
  }

  // ── HTML 管道（含 extraListeners；只在客户端 onMounted 后由组件调用，顶层不碰 document）──
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
      // 最前：把正文残留的外来 class 前缀化，隔离 UnoCSS 全局原子类误伤（详见 ClassIsolationProcessor）
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
    if (!p.ready.value) return // 原 fork 的 localReady 门控（默认 ready=true 时无影响）
    if (!articleSelectionRef.value && p.containerDom.value && p.monitorDom.value) {
      const config = {
        shareCode: p.shareCode || '',
        bookmarkId: p.bookmarkId || 0,
        collection: collection.value,
        allowAction: effAllowAction.value,
        ownerUserId: effOwnerUserId.value, // 初始化「时刻」取值，之后不更新既有实例
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
          // bookmarkUserId 在 snapshot 详情下可能是 hash 串（detail.user_id），provider 字段类型为 number；
          // 忠实保留现状运行时取值（LF=数值 userId / 非 LF 快照=hash 串原样透传），仅在边界 cast 满足类型。
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

    // 忠实复制现状取值，不做「优化回退」：
    // markSource==='props'(local-first) → props.marks ?? 空集；
    // 默认(detail) → upstream 原 if/else（key 存在就用 detail.marks，即使为 null，不回退 props.marks）。
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

  // jumpToHighLight：upstream 原样搬入，内部 source 固定读 `detail.marks || props.marks || []`，
  // 不改成 markSource 口径——保持与现状逐字等价。仅调用时机不变（drawMark 完成后）。
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

  // watch（round 5：拆回带守卫，避免 marks=falsy / ready=false 时多触发）：
  //  · marks watcher：value && isHandledHTML（= upstream marks watcher）
  //  · ready watcher：ready && isHandledHTML（= fork localReady watcher；非 LF 下 ready 恒 true 不触发）
  //  · htmlReady watcher：首绘由 false→true 单独触发一次（替代原 onMounted .then(handleDrawMark)）
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
