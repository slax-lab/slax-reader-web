// 书签列表数据层：列表状态 + 分页 + 查询 + 无限滚动 + 派生计算 + cell handlers + 频道同步
// 依赖方向：单向依赖 useBookmarkFilter（读 filter ref）+ 页面传入的 searchText，无构造期循环依赖。
// scrollY（useScroll）归页面持有，不在此处。
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'

import { isClient } from '@commons/utils/is'
import type { ChannelMessageData } from '#layers/core/app/utils/channel'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkItem, HighlightItem, UserNotificationMessageItem } from '@commons/types/interface'
import { useDebounceFn, useEventListener, useInfiniteScroll } from '@vueuse/core'
import type { useBookmarkFilter } from '#layers/core/app/composables/bookmark/useBookmarkFilter'
import type { Ref } from 'vue'

type BookmarkFilter = ReturnType<typeof useBookmarkFilter>

// 日期分组条目类型
type GroupedItem = { type: 'group'; label: string; key: string } | { type: 'bookmark'; bookmark: BookmarkItem; index: number }

export const useBookmarkData = (filter: BookmarkFilter, searchText: Ref<string>) => {
  const { t } = useI18n()

  const bookmarks = ref<BookmarkItem[]>([])
  const highlights = ref<HighlightItem[]>([])
  const notifications = ref<UserNotificationMessageItem[]>([])
  const loading = ref(false)
  const ending = ref(false)
  const page = ref(1)
  const isTransitioning = ref(false)
  const isFirstLoad = ref(true)
  const isActivated = ref(true)

  // === 派生计算 ===

  // 将书签列表按年月分组，插入分组标签
  const groupedBookmarks = computed<GroupedItem[]>(() => {
    // highlights / notifications 不分组
    if (['highlights', 'notifications'].includes(filter.filterStatus.value)) return []
    const result: GroupedItem[] = []
    let lastGroup = ''
    bookmarks.value.forEach((bookmark, index) => {
      const dateStr = bookmark.created_at
      if (dateStr) {
        const date = new Date(dateStr)
        const groupKey = `${date.getFullYear()}-${date.getMonth()}`
        if (groupKey !== lastGroup) {
          result.push({
            type: 'group',
            label: t('page.bookmarks_index.date_group_format', {
              year: date.getFullYear(),
              month: date.getMonth() + 1
            }),
            key: groupKey
          })
          lastGroup = groupKey
        }
      }
      result.push({ type: 'bookmark', bookmark, index })
    })
    return result
  })

  const isRefreshLoading = computed(() => loading.value && page.value === 1)

  // 最近更新时间：取列表中最新书签的 created_at，格式化为相对时间
  const lastUpdatedText = computed(() => {
    const latest = bookmarks.value[0]?.created_at
    if (!latest) return ''
    const diff = Date.now() - new Date(latest).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    let time: string
    if (mins < 1) time = t('page.bookmarks_index.just_now')
    else if (hours < 1) time = t('page.bookmarks_index.minutes_ago', { n: mins })
    else if (days < 1) time = t('page.bookmarks_index.hours_ago', { n: hours })
    else time = t('page.bookmarks_index.days_ago', { n: days })
    return t('page.bookmarks_index.last_updated_at', { time })
  })

  const isDataEmpty = computed(() => {
    switch (filter.filterStatus.value) {
      case 'highlights':
        return highlights.value.length === 0
      case 'notifications':
        return notifications.value.length === 0
      case 'topics':
        return filter.filterTopicId.value ? bookmarks.value.length === 0 : false
      case 'collections':
        return filter.filterCollectionId.value ? bookmarks.value.length === 0 : false
      default:
        return bookmarks.value.length === 0
    }
  })

  const showList = computed(() => {
    if (isTransitioning.value) return true
    if (searchText.value) return false

    switch (filter.filterStatus.value) {
      case 'highlights':
        return highlights.value.length > 0
      case 'notifications':
        return notifications.value.length > 0
      default:
        return bookmarks.value.length > 0
    }
  })

  // === 查询 ===

  const queryBookmarks = async () => {
    return await request().get<BookmarkItem[]>({
      url: RESTMethodPath.BOOKMARK_LIST,
      query: {
        page: page.value,
        size: 20,
        filter: `${filter.filterStatus.value}`,
        topic_id: String(filter.filterTopicId.value) || '',
        collection_id: String(filter.filterCollectionId.value) || ''
      }
    })
  }

  const queryHighlights = async () => {
    return await request().get<HighlightItem[]>({
      url: RESTMethodPath.HIGHLIGHT_LIST,
      query: {
        page: page.value,
        size: 6
      }
    })
  }

  const queryNotifications = async () => {
    const res = await request().get<UserNotificationMessageItem[]>({
      url: RESTMethodPath.NOTIFICATION_LIST,
      query: {
        page: page.value,
        page_size: 10
      }
    })

    if (page.value === 1) {
      request().post({ url: RESTMethodPath.NOTIFICATION_MARK_READ_ALL })
    }

    return res
  }

  // === 分页 + 加载 ===

  const loadData = async <T extends any[]>(query: () => Promise<T | undefined>) => {
    loading.value = true
    const data = await query()
    loading.value = false

    if (!data || data.length < 1) {
      ending.value = true
      return
    }

    page.value += 1
    return data
  }

  const resetBookmarks = () => {
    bookmarks.value = []
    highlights.value = []
    notifications.value = []
    loading.value = false
    ending.value = false
    page.value = 1
    isTransitioning.value = false

    reset()
  }

  const onLoadMore = async () => {
    if (isFirstLoad.value) {
      isFirstLoad.value = false
    }

    if (loading.value || ending.value) return
    if ((filter.filterStatus.value === 'topics' && filter.filterTopicId.value < 1) || (filter.filterStatus.value === 'collections' && filter.filterCollectionId.value < 1)) {
      resetBookmarks()
      ending.value = true

      return
    }

    const type = filter.filterStatus.value
    const topicId = type === 'topics' ? filter.filterTopicId.value : 0

    if (filter.filterStatus.value === 'highlights') {
      const data = await loadData(queryHighlights)
      type === filter.filterStatus.value && highlights.value.push(...(data || []))
    } else if (filter.filterStatus.value === 'notifications') {
      const data = await loadData(queryNotifications)
      type === filter.filterStatus.value && notifications.value.push(...(data || []))
    } else {
      const data = await loadData(queryBookmarks)
      type === filter.filterStatus.value && (type !== 'topics' || topicId === filter.filterTopicId.value) && bookmarks.value.push(...(data || []))
    }
  }

  const reloadList = () => {
    resetBookmarks()
    onLoadMore()
  }

  // === 无限滚动 ===

  const canLoadMoreList = () => !loading.value && !ending.value && isActivated.value && !searchText.value
  const { reset } = useInfiniteScroll(
    isClient ? window : null,
    () => {
      onLoadMore()
    },
    {
      distance: 100,
      canLoadMore: canLoadMoreList
    }
  )
  const resetInfiniteScroll = useDebounceFn(() => {
    reset()
  }, 1000)

  if (isClient) {
    useEventListener(window, 'resize', resetInfiniteScroll)
    if (window.visualViewport) {
      useEventListener(window.visualViewport, 'resize', resetInfiniteScroll)
    }
  }

  onActivated(() => {
    isActivated.value = true
  })

  onDeactivated(() => {
    isActivated.value = false
  })

  // === cell handlers ===

  const handleCellArchive = (id: number, archive: boolean) => {
    if (filter.filterStatus.value === 'inbox' && archive) {
      bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
    } else if (filter.filterStatus.value === 'archive' && !archive) {
      bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
    } else {
      const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
      bookmark && (bookmark.archived = archive ? 'archive' : 'inbox')
    }
  }

  const handleCellAliasTitle = (id: number, aliasTitle: string) => {
    const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
    bookmark && (bookmark.alias_title = aliasTitle)
  }

  const handleCellBookmarkUpdate = (id: number, bookmark: BookmarkItem) => {
    const index = bookmarks.value.findIndex(bookmark => bookmark.id === id)
    if (index > -1) {
      bookmarks.value.splice(index, 1, bookmark)
    }
  }

  const handleDelete = (id: number) => {
    isTransitioning.value = true
    bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
  }

  const transitionLeave = () => {
    isTransitioning.value = false
  }

  // === 频道同步：跨标签页的归档/收藏/删除消息 → 列表增量更新 ===

  const channelMessageHandler = (name: keyof ChannelMessageData, data: Partial<ChannelMessageData>) => {
    if ((bookmarks.value.length === 0 && loading.value) || !data[name]) return

    if (name === 'archive') {
      const { id, cancel } = data[name]

      if ((!cancel && filter.filterStatus.value === 'inbox') || (cancel && filter.filterStatus.value === 'archive')) {
        bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
      } else if ((!cancel && filter.filterStatus.value === 'archive') || (cancel && filter.filterStatus.value === 'inbox')) {
        reloadList()
      } else if (filter.filterStatus.value === 'starred') {
        const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
        if (bookmark) {
          bookmark.archived = cancel ? 'inbox' : 'archive'
        }
      }
    } else if (name === 'star') {
      const { id, cancel } = data[name]

      if (filter.filterStatus.value === 'starred') {
        reloadList()
      } else {
        const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
        if (bookmark) {
          bookmark.starred = cancel ? 'unstar' : 'star'
        }
      }
    } else if (name === 'trashed') {
      const { id, trashed } = data[name]

      if (filter.filterStatus.value === 'trashed') {
        if (trashed) {
          bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
        } else {
          reloadList()
        }
      } else if (filter.filterStatus.value === 'inbox') {
        reloadList()
      }
    }
  }

  onMounted(() => {
    addChannelMessageHandler(channelMessageHandler)
  })

  onUnmounted(() => {
    removeChannelMessageHandler(channelMessageHandler)
  })

  return {
    // state
    bookmarks,
    highlights,
    notifications,
    loading,
    ending,
    isTransitioning,
    isFirstLoad,
    // computed
    groupedBookmarks,
    isRefreshLoading,
    lastUpdatedText,
    isDataEmpty,
    showList,
    // actions
    onLoadMore,
    resetBookmarks,
    reloadList,
    handleCellArchive,
    handleCellAliasTitle,
    handleCellBookmarkUpdate,
    handleDelete,
    transitionLeave
  }
}
