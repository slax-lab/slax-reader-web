import { computed } from 'vue'

import { RESTMethodPath } from '@commons/types/const'

export const useArticleDetail = (detail: Ref<BookmarkArticleDetail>) => {
  const { t } = useI18n()
  const title = computed(() => (isBookmarkDetail(detail.value) ? detail.value.alias_title || detail.value.title : detail.value.title) || t('component.bookmark_article.no_title'))

  const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
  const allowStarred = computed(() => {
    return isBookmarkDetail(detail.value) && !detail.value.trashed_at
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
