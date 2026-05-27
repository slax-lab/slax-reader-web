import type { MarkCommentInfo, MarkItemInfo, QuoteData } from '@slax-reader/selection/types'
import type { DwebArticleSelection } from '#layers/core/app/components/Article/Selection/DwebArticleSelection'

export interface CommentPanelEvent {
  kind: 'new'
  info: MarkItemInfo
  quote: QuoteData
}

export interface CommentPanelExistingEvent {
  kind: 'existing'
  infoId: string
  info: MarkItemInfo
}

/**
 * 划线 ↔ 评论卡片双向联动。
 * 维护 markUid/stroke.mark_uid（后端 key）→ MarkItemInfo.id（DOM data-uuid key）的映射。
 */
export function useCommentPanel({ activePanel, articleSelection }: { activePanel: Ref<'ai' | 'chat' | 'comment' | null>; articleSelection: Ref<DwebArticleSelection | null> }) {
  const activeInfoId = ref<string | null>(null)
  const pendingSelection = ref<MarkItemInfo | null>(null)
  const pendingQuote = ref<QuoteData | null>(null)

  // 维护后端 markUid → MarkItemInfo.id 映射（DOM 查询用 info.id，后端用 markUid）
  const collectComment = (map: Map<string, string>, c: MarkCommentInfo, infoId: string) => {
    if (c.markUid) map.set(c.markUid, infoId)
    for (const child of c.children ?? []) collectComment(map, child, infoId)
  }

  const markUidToInfoId = computed(() => {
    const map = new Map<string, string>()
    const infos = articleSelection.value?.markItemInfos?.value ?? []
    for (const info of infos) {
      for (const c of info.comments) collectComment(map, c, info.id)
      for (const s of info.stroke) {
        if (s.mark_uid) map.set(s.mark_uid, info.id)
      }
    }
    return map
  })

  // 通过 info.id 滚动到对应卡片并闪烁
  const focusByInfoId = (infoId: string) => {
    activeInfoId.value = infoId
    nextTick(() => {
      const card = document.querySelector(`[data-comment-info-id="${infoId}"]`) as HTMLElement
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      card?.classList.add('is-active')
      setTimeout(() => card?.classList.remove('is-active'), 1200)
    })
  }

  // 通过 info.id 闪烁正文划线
  const flashMarkByInfoId = (infoId: string) => {
    const mark = document.querySelector(`slax-mark[data-uuid="${infoId}"]`) as HTMLElement
    if (!mark) return
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    mark.classList.add('hl-flash')
    setTimeout(() => mark.classList.remove('hl-flash'), 1200)
  }

  // 监听 slax:open-comment-panel 事件
  if (import.meta.client) {
    const onOpenCommentPanel = (e: Event) => {
      const detail = (e as CustomEvent).detail as CommentPanelEvent | CommentPanelExistingEvent
      activePanel.value = 'comment'

      if (detail.kind === 'new') {
        pendingSelection.value = detail.info
        pendingQuote.value = detail.quote
        activeInfoId.value = null
      } else {
        activeInfoId.value = detail.infoId
        pendingSelection.value = null
        pendingQuote.value = null
        focusByInfoId(detail.infoId)
      }
    }

    onMounted(() => window.addEventListener('slax:open-comment-panel', onOpenCommentPanel))
    onUnmounted(() => window.removeEventListener('slax:open-comment-panel', onOpenCommentPanel))
  }

  return {
    activeInfoId,
    pendingSelection,
    pendingQuote,
    markUidToInfoId,
    focusByInfoId,
    flashMarkByInfoId
  }
}
