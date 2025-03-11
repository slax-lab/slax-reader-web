import { computed } from 'vue'

import type { BookmarkArticleDetail } from './type'
import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkDetail, type ShareBookmarkDetail } from '@commons/types/interface'

const isBookmarkDetail = (detail: BookmarkArticleDetail): detail is BookmarkDetail => 'bookmark_id' in detail && 'starred' in detail && 'archived' in detail
const isShareBookmarkDetail = (detail: BookmarkArticleDetail): detail is ShareBookmarkDetail => 'share_info' in detail

export const useArticleDetail = (detail: Ref<BookmarkArticleDetail>) => {
  const { t } = useI18n()
  const title = computed(() => (isBookmarkDetail(detail.value) ? detail.value.alias_title || detail.value.title : detail.value.title) || t('component.bookmark_article.no_title'))

  const allowStarred = computed(() => {
    return isBookmarkDetail(detail.value) && !detail.value.trashed_at
  })

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

  const allowTagged = computed(() => {
    return isBookmarkDetail(detail.value) && !detail.value.trashed_at
  })

  const isStarred = computed(() => {
    return isBookmarkDetail(detail.value) && detail.value.starred === 'star'
  })

  const bookmarkId = isBookmarkDetail(detail.value) ? detail.value.bookmark_id : undefined
  const shareCode = isShareBookmarkDetail(detail.value) ? detail.value.share_info.share_code : undefined

  const updateStarred = isBookmarkDetail(detail.value)
    ? async (isStar: boolean) => {
        if (!bookmarkId || !isBookmarkDetail(detail.value)) {
          return
        }

        const status = !isStar ? 'unstar' : 'star'
        await request.post<{ bookmark_id: number; status: string }>({
          url: RESTMethodPath.BOOKMARK_STAR,
          body: {
            bookmark_id: bookmarkId,
            status
          }
        })

        detail.value.starred = status
        detail.value = JSON.parse(JSON.stringify(detail.value))
      }
    : undefined
  return {
    bookmarkId,
    shareCode,
    title,
    isStarred,
    allowStarred,
    allowAction,
    allowTagged,
    bookmarkUserId,
    updateStarred
  }
}

export const useStar = () => {}
