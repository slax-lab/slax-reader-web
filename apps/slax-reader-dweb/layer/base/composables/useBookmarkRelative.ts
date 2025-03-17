import { type BookmarkDetail, type ShareBookmarkDetail } from '@commons/types/interface'
import { showFeedbackModal } from '#layers/base/components/Modal'
import { useUserStore } from '#layers/base/stores/user'

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

export const isBookmarkDetail = (detail: BookmarkArticleDetail): detail is BookmarkDetail => 'bookmark_id' in detail && 'starred' in detail && 'archived' in detail
export const isShareBookmarkDetail = (detail: BookmarkArticleDetail): detail is ShareBookmarkDetail => 'share_info' in detail

export const BookmarkTabTypes = ['inbox', 'starred', 'topics', 'highlights', 'archive']

export const logChat = (options: BookmarkTypeOptions, userId: number) => {
  if (options.type === BookmarkType.Normal) {
    const { bmId, title } = options
    analyticsLog({
      event: 'click_ai_chat',
      value: {
        user: userId || 0,
        bookmark_id: bmId,
        source: 'bookmark',
        title: title
      }
    })
  } else if (options.type === BookmarkType.Share) {
    const { shareCode, title } = options
    analyticsLog({
      event: 'click_ai_chat',
      value: {
        user: userId || 0,
        share_code: shareCode,
        source: 'bookmark',
        title: title
      }
    })
  }
}

export const logAnalyzed = (options: BookmarkTypeOptions, userId: number) => {
  if (options.type === BookmarkType.Normal) {
    const { bmId } = options
    analyticsLog({
      event: 'click_ai_summary',
      value: {
        user: userId || 0,
        bookmark_id: bmId
      }
    })
  } else if (options.type === BookmarkType.Share) {
    const { shareCode } = options
    analyticsLog({
      event: 'click_ai_summary',
      value: {
        user: userId || 0,
        share_code: shareCode
      }
    })
  }
}

export const showFeedbackView = (options: BookmarkTypeOptions, type: string) => {
  if (options.type === BookmarkType.Normal) {
    showFeedbackModal({
      reportType: type,
      title: options.title,
      params: {
        bookmark_id: options.bmId
      }
    })
  } else if (options.type === BookmarkType.Share) {
    showFeedbackModal({
      reportType: type,
      title: options.title,
      params: {
        share_code: options.shareCode
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
