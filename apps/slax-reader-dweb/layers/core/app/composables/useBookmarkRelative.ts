import { type BookmarkBriefDetail, type BookmarkDetail, type InlineBookmarkDetail, type ShareBookmarkDetail } from '@commons/types/interface'
import { showFeedbackModal } from '#layers/core/app/components/Modal'
import { useUserStore } from '#layers/core/app/stores/user'

export enum BookmarkType {
  Normal = 'normal',
  Share = 'share'
}

export type BookmarkTypeOptions =
  | {
      type: BookmarkType.Normal
      title: string
      bmId: number
    }
  | {
      type: BookmarkType.Share
      title: string
      shareCode: string
    }

export type BookmarkArticleDetail = BookmarkDetail | ShareBookmarkDetail
export type WebBookmarkArticleDetail = BookmarkBriefDetail | InlineBookmarkDetail

export const isBookmarkDetail = (detail: BookmarkArticleDetail): detail is BookmarkDetail => 'bookmark_id' in detail && 'starred' in detail && 'archived' in detail
export const isShareBookmarkDetail = (detail: BookmarkArticleDetail): detail is ShareBookmarkDetail => 'share_info' in detail
export const isBookmarkBrief = (detail: WebBookmarkArticleDetail): detail is BookmarkBriefDetail => 'target_url' in detail && 'created_at' in detail && 'updated_at' in detail
export const isInlineBookmarkDetail = (detail: WebBookmarkArticleDetail): detail is InlineBookmarkDetail => 'share_info' in detail && 'user_info' in detail

export const BookmarkTabTypes = ['inbox', 'starred', 'topics', 'highlights', 'archive']

// Tab 图标 SVG path 内容（inline，不依赖图片文件）
// 覆盖此 composable 的 fork 可扩展此对象以支持额外 tab 类型（如 collections）
export const TabIconPaths: Record<string, string> = {
  inbox: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8M8 12h6M8 16h4"/>',
  starred: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  topics:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  highlights: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>'
}

export const showFeedbackView = (options: BookmarkTypeOptions, type: string) => {
  const href = `${window.location.origin}${window.location.pathname}`
  const email = useUserStore().userInfo?.email

  if (options.type === BookmarkType.Normal) {
    showFeedbackModal({
      reportType: type,
      title: options.title,
      href,
      email: email || '',
      params: {
        bookmark_id: options.bmId,
        entry_point: 'bookmark_detail',
        target_url: href
      }
    })
  } else if (options.type === BookmarkType.Share) {
    showFeedbackModal({
      reportType: type,
      title: options.title,
      href,
      email: email || '',
      params: {
        share_code: options.shareCode,
        entry_point: 'share',
        target_url: href
      }
    })
  }
}

export const useBookmarkArticleRelative = (detail: Ref<BookmarkArticleDetail>) => {
  const allowAction = computed(() => {
    if (isBookmarkDetail(detail.value)) {
      return true
    }

    const userId = useUserStore().userInfo?.userId

    if ('share_info' in detail.value && (detail.value.share_info.allow_action || detail.value.user_id === userId)) {
      return true
    }

    return false
  })

  const bookmarkUserId = computed(() => {
    if (isBookmarkDetail(detail.value)) {
      return detail.value.user_id
    }

    if ('share_info' in detail.value) {
      return detail.value.user_id
    }

    return 0
  })

  return {
    allowAction,
    bookmarkUserId
  }
}

export const useWebBookmarkArticleRelative = (detail: Ref<WebBookmarkArticleDetail | null>) => {
  const allowAction = computed(() => {
    if (!detail.value) {
      return false
    }

    if (isBookmarkBrief(detail.value)) {
      return true
    }

    const userId = useUserStore().userInfo?.userId

    if (isInlineBookmarkDetail(detail.value) && (detail.value.share_info.allow_action || detail.value.owner_user_id === userId)) {
      return true
    }

    return false
  })

  const bookmarkUserId = computed(() => {
    if (!detail.value) {
      return 0
    }

    const userId = useUserStore().userInfo?.userId

    if (isBookmarkBrief(detail.value)) {
      return userId || 0
    }

    if (isInlineBookmarkDetail(detail.value)) {
      return detail.value.owner_user_id
    }

    return 0
  })

  return {
    allowAction,
    bookmarkUserId
  }
}

export const logAnalyzed = (_options: BookmarkTypeOptions, _userId: number) => {}

export const logChat = (_options: BookmarkTypeOptions, _userId: number) => {}

export const useLogBookmark = (options: BookmarkTypeOptions) => {
  if (options.type === BookmarkType.Share) {
    analyticsLog({
      event: 'bookmark_view',
      id: options.shareCode,
      mode: 'snapshot'
    })
  } else if (options.type === BookmarkType.Normal) {
    analyticsLog({
      event: 'bookmark_view',
      id: `${options.bmId}`,
      mode: 'snapshot'
    })
  }
}
