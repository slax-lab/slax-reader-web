<template>
  <div class="bookmarks-view">
    <div class="fixed left-0 top-0 z-100 h-0px w-full flex-center">
      <Transition name="list-loading">
        <div class="bg-surface-solid h-30px w-30px translate-y-50px rounded-full shadow-md flex-center -mt-30px" v-show="showRefreshLoading">
          <div class="i-svg-spinners:90-ring text-h2 text-accent"></div>
        </div>
      </Transition>
    </div>
    <!-- AddUrlTopModal 保留在根级别，由 FAB 触发 -->
    <AddUrlTopModal v-model:show="isShowTopModal" @add-url-success="addUrlSuccess" />

    <!-- FAB：浮动添加按钮 -->
    <BookmarksFab @click="isShowTopModal = true" />

    <BookmarksLayout ref="bookmarksLayout" @search="text => (searchText = text)" @feedback="feedbackClick" @check-all="showNotificationList">
      <template v-slot:sidebar-left>
        <TabsSidebar ref="tabsSidebar" :tabType="searchText ? '' : filterStatus" @change-tab="inboxClick" />
      </template>
      <template v-slot:content-header>
        <BookmarksContentHeader
          :search-text="searchText"
          :filter-status="filterStatus"
          :filter-topic-id="filterTopicId"
          :filter-topic-name="filterTopicName"
          :filter-collection-id="filterCollectionId"
          :filter-collection-name="filterCollectionName"
          @back="() => (searchText = '')"
          @search-status-update="status => (isSearching = status)"
          @select-tag="selectTopic"
          @select-collect="selectCollection"
          @code-update="(code: string) => (filterCollectionCode = code)"
          @notification-back="notificationBack"
        />
      </template>
      <template v-slot:content-list>
        <!-- 布局切换器：非搜索、非 highlights/notifications、非话题未选标签时显示 -->
        <ListLayoutSwitcher
          v-if="!searchText && !['highlights', 'notifications'].includes(filterStatus) && !(filterStatus === 'topics' && !filterTopicId)"
          v-model="listMode"
          :last-updated-text="lastUpdatedText"
        />

        <div class="bookmarks" v-if="showList">
          <template v-if="['highlights', 'notifications'].indexOf(filterStatus) === -1">
            <TransitionGroup :name="loading ? '' : 'opacity'" @after-leave="transitionLeave">
              <template v-for="item in groupedBookmarks" :key="item.type === 'group' ? item.key : item.bookmark.id">
                <BookmarkDateGroup v-if="item.type === 'group'" :label="item.label" />
                <BookmarkCell
                  v-else
                  :index="item.index"
                  :is-subscribe="filterStatus === 'collections'"
                  :bookmark="item.bookmark"
                  :collection-code="filterCollectionCode"
                  :class="{ 'text-mode': listMode === 'text' }"
                  @delete="handleDelete"
                  @archive-update="handleCellArchive"
                  @alias-title-update="handleCellAliasTitle"
                  @bookmark-update="handleCellBookmarkUpdate"
                />
              </template>
            </TransitionGroup>
          </template>
          <template v-else-if="filterStatus === 'highlights'">
            <div class="card-cells-wrapper">
              <BookmarkHighlightCell v-for="highlight in highlights" :key="highlight.id" :highlight="highlight" />
            </div>
          </template>
          <template v-else-if="filterStatus === 'notifications'">
            <div class="card-cells-wrapper">
              <TransitionGroup :name="loading ? '' : 'opacity'" @after-leave="transitionLeave">
                <NotificationCell v-for="notification in notifications" :key="notification.id" :notification="notification" />
              </TransitionGroup>
            </div>
          </template>
        </div>
        <template v-if="!(isTransitioning && isDataEmpty) && !searchText">
          <BookmarksEmptyState v-if="!loading && isDataEmpty" :filter-status="filterStatus" :is-current-inbox-tab="isCurrentInboxTab" :is-first-load="isFirstLoad" />
          <ListBottomStatus
            v-else
            :loading="loading"
            :ending="ending"
            :is-refresh-loading="isRefreshLoading"
            :is-in-trash="isInTrash"
            :filter-status="filterStatus"
            :filter-topic-id="filterTopicId"
            :filter-collection-id="filterCollectionId"
          />
        </template>
      </template>
    </BookmarksLayout>
  </div>
</template>

<script lang="ts" setup>
import AddUrlTopModal from '#layers/core/app/components/BookmarkList/AddUrlTopModal.vue'
import BookmarkCell from '#layers/core/app/components/BookmarkList/BookmarkCell.vue'
import BookmarkDateGroup from '#layers/core/app/components/BookmarkList/BookmarkDateGroup.vue'
import BookmarkHighlightCell from '#layers/core/app/components/BookmarkList/BookmarkHighlightCell.vue'
import BookmarksContentHeader from '#layers/core/app/components/BookmarkList/BookmarksContentHeader.vue'
import BookmarksEmptyState from '#layers/core/app/components/BookmarkList/BookmarksEmptyState.vue'
import BookmarksFab from '#layers/core/app/components/BookmarkList/BookmarksFab.vue'
import ListBottomStatus from '#layers/core/app/components/BookmarkList/ListBottomStatus.vue'
import ListLayoutSwitcher from '#layers/core/app/components/BookmarkList/ListLayoutSwitcher.vue'
import TabsSidebar from '#layers/core/app/components/BookmarkList/TabsSidebar.vue'
import BookmarksLayout from '#layers/core/app/components/Layouts/BookmarksLayout.vue'
import NotificationCell from '#layers/core/app/components/Notification/NotificationCell.vue'

import { isSafari } from '@commons/utils/is'
import type { ChannelMessageData } from '#layers/core/app/utils/channel'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkItem, HighlightItem, UserNotificationMessageItem } from '@commons/types/interface'
import { useDebounceFn, useEventListener, useInfiniteScroll } from '@vueuse/core'
import { showFeedbackModal } from '#layers/core/app/components/Modal'
import Toast from '#layers/core/app/components/Toast'
import { useBookmarkFilter } from '#layers/core/app/composables/bookmark/useBookmarkFilter'
import { useListLayoutMode } from '#layers/core/app/composables/bookmark/useListLayoutMode'
import { useRefreshIndicator } from '#layers/core/app/composables/bookmark/useRefreshIndicator'
import useNotification from '#layers/core/app/composables/useNotification'
import { useUserStore } from '#layers/core/app/stores/user'

const { t } = useI18n()

defineOptions({
  name: 'bookmarks'
})

useHead({
  titleTemplate: t('common.app.name')
})

const bookmarksLayout = ref<InstanceType<typeof BookmarksLayout>>()
const tabsSidebar = ref<InstanceType<typeof TabsSidebar>>()
const isActivated = ref(true)
const isFirstLoad = ref(true)
const route = useRoute()
const userStore = useUserStore()
const bookmarks = ref<BookmarkItem[]>([])
const loading = ref(false)
const ending = ref(false)
const page = ref(1)

// 筛选状态 + 纯导航 helper（编排动作 selectTopic/selectCollection/inboxClick 留在本页）
const {
  filterStatus,
  filterTopicId,
  filterTopicName,
  filterCollectionId,
  filterCollectionCode,
  filterCollectionName,
  isInTrash,
  isCurrentInboxTab,
  applyTopic,
  applyCollection,
  applyTab
} = useBookmarkFilter()

const searchText = ref('')
const isSearching = ref(false)

const isTransitioning = ref(false)
const highlights = ref<HighlightItem[]>([])
const notifications = ref<UserNotificationMessageItem[]>([])

const isShowTopModal = ref(false)

// 列表布局模式（card / text），localStorage 持久化
const { listMode } = useListLayoutMode()

// 日期分组条目类型
type GroupedItem = { type: 'group'; label: string; key: string } | { type: 'bookmark'; bookmark: BookmarkItem; index: number }

// 将书签列表按年月分组，插入分组标签
const groupedBookmarks = computed<GroupedItem[]>(() => {
  // highlights / notifications 不分组
  if (['highlights', 'notifications'].includes(filterStatus.value)) return []
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

const isRefreshLoading = computed(() => {
  return loading.value && page.value === 1
})

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
  switch (filterStatus.value) {
    case 'highlights':
      return highlights.value.length === 0
    case 'notifications':
      return notifications.value.length === 0
    case 'topics':
      return filterTopicId.value ? bookmarks.value.length === 0 : false
    case 'collections':
      return filterCollectionId.value ? bookmarks.value.length === 0 : false
    default:
      return bookmarks.value.length === 0
  }
})

const showList = computed(() => {
  if (isTransitioning.value) return true
  if (searchText.value) return false

  switch (filterStatus.value) {
    case 'highlights':
      return highlights.value.length > 0
    case 'notifications':
      return notifications.value.length > 0
    default:
      return bookmarks.value.length > 0
  }
})

const addLog = () => {
  const sectionMap: Record<string, 'inbox' | 'starred' | 'topics' | 'highlights' | 'archive' | 'trash' | 'notifications'> = {
    inbox: 'inbox',
    starred: 'starred',
    topics: 'topics',
    highlights: 'highlights',
    archive: 'archive',
    trashed: 'trash',
    notifications: 'notifications'
  }

  const section = sectionMap[filterStatus.value] || 'inbox'
  analyticsLog({
    event: 'bookmark_list_view',
    section
  })
}

watch(
  () => route.query.filter,
  (newValue, oldValue) => {
    if (newValue === oldValue) {
      return
    }

    filterStatus.value = `${newValue || 'inbox'}`
    addLog()
  }
)

watch(filterStatus, (value, oldValue) => {
  if (value === oldValue) {
    return
  }

  reloadList()
})

// 刷新指示器：首屏加载时延迟 250ms 展示顶部 spinner
const { showRefreshLoading } = useRefreshIndicator(isRefreshLoading)

const { y } = useScroll(window, { behavior: 'smooth', throttle: 10 })
const canLoadMoreList = () => !loading.value && !ending.value && isActivated.value && !searchText.value
const { reset } = useInfiniteScroll(
  window,
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

useEventListener(window, 'resize', resetInfiniteScroll)

if (window.visualViewport) {
  useEventListener(window.visualViewport, 'resize', resetInfiniteScroll)
}

userStore.getUserInfo({ refresh: true })

onMounted(() => {
  addChannelMessageHandler(chanelMessageHandler)
  !isSafari() && useNotification().requestPushPermission()
  addLog()
})

onActivated(() => {
  isActivated.value = true
})

onDeactivated(() => {
  isActivated.value = false
})

onUnmounted(() => {
  removeChannelMessageHandler(chanelMessageHandler)
})

const reloadList = () => {
  resetBookmarks()
  onLoadMore()
}

const chanelMessageHandler = (name: keyof ChannelMessageData, data: Partial<ChannelMessageData>) => {
  if ((bookmarks.value.length === 0 && loading.value) || !data[name]) return

  if (name === 'archive') {
    const { id, cancel } = data[name]

    if ((!cancel && filterStatus.value === 'inbox') || (cancel && filterStatus.value === 'archive')) {
      bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
    } else if ((!cancel && filterStatus.value === 'archive') || (cancel && filterStatus.value === 'inbox')) {
      reloadList()
    } else if (filterStatus.value === 'starred') {
      const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
      if (bookmark) {
        bookmark.archived = cancel ? 'inbox' : 'archive'
      }
    }
  } else if (name === 'star') {
    const { id, cancel } = data[name]

    if (filterStatus.value === 'starred') {
      reloadList()
    } else {
      const bookmark = bookmarks.value.find(bookmark => bookmark.id === id)
      if (bookmark) {
        bookmark.starred = cancel ? 'unstar' : 'star'
      }
    }
  } else if (name === 'trashed') {
    const { id, trashed } = data[name]

    if (filterStatus.value === 'trashed') {
      if (trashed) {
        bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
      } else {
        reloadList()
      }
    } else if (filterStatus.value === 'inbox') {
      reloadList()
    }
  }
}

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
  if ((filterStatus.value === 'topics' && filterTopicId.value < 1) || (filterStatus.value === 'collections' && filterCollectionId.value < 1)) {
    resetBookmarks()
    ending.value = true

    return
  }

  const type = filterStatus.value
  const topicId = type === 'topics' ? filterTopicId.value : 0

  if (filterStatus.value === 'highlights') {
    const data = await loadData(queryHighlights)
    type === filterStatus.value && highlights.value.push(...(data || []))
  } else if (filterStatus.value === 'notifications') {
    const data = await loadData(queryNotifications)
    type === filterStatus.value && notifications.value.push(...(data || []))
  } else {
    const data = await loadData(queryBookmarks)
    type === filterStatus.value && (type !== 'topics' || topicId === filterTopicId.value) && bookmarks.value.push(...(data || []))
  }
}

// 编排动作：选择话题。filterStatus 不变（始终 'topics'），故手动 reset + load
const selectTopic = async (info: { id: number; name: string } | null) => {
  resetBookmarks()
  await applyTopic(info)
  await onLoadMore()
}

// 编排动作：选择合集。filterStatus 不变（始终 'collections'），故手动 reset + load
const selectCollection = async (info: { id: number; name: string; code: string } | null) => {
  resetBookmarks()
  await applyCollection(info)
  await onLoadMore()
}

// 编排动作：切换 tab（原 inboxClick）。搜索态先复位 + 同 tab 短路；
//   applyTab 改 filterStatus → watch(filterStatus) 触发重载，故此处不调 onLoadMore
const inboxClick = async (type: string, index?: number) => {
  if (searchText.value) {
    searchText.value = ''
    y.value = 0
  }

  if (type === filterStatus.value) {
    return
  }

  resetBookmarks()
  await applyTab(type)

  if (index !== undefined && bookmarksLayout.value?.isSmallScreen()) {
    const button = tabsSidebar.value?.getAllButtons()[index]
    button?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const checkMore = async () => {
  ending.value = false
  await onLoadMore()
}

const handleCellArchive = (id: number, archive: boolean) => {
  if (filterStatus.value === 'inbox' && archive) {
    bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== id)
  } else if (filterStatus.value === 'archive' && !archive) {
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

const queryBookmarks = async () => {
  return await request().get<BookmarkItem[]>({
    url: RESTMethodPath.BOOKMARK_LIST,
    query: {
      page: page.value,
      size: 20,
      filter: `${filterStatus.value}`,
      topic_id: String(filterTopicId.value) || '',
      collection_id: String(filterCollectionId.value) || ''
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

const transitionLeave = () => {
  isTransitioning.value = false
}

const addUrlSuccess = () => {
  Toast.showToast({
    text: t('common.tips.add_url_success')
  })

  reloadList()
}

const feedbackClick = () => {
  const email = useUserStore().userInfo?.email
  showFeedbackModal({
    reportType: 'parse_error',
    title: '',
    email: email || '',
    params: {
      entry_point: 'inbox'
    }
  })
}

const showNotificationList = () => {
  inboxClick('notifications')
}

const notificationBack = () => {
  useRouter().go(-1)
}
</script>

<style lang="scss" scoped>
.bookmarks-view {
  .bookmarks {
    --style: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;

    // 文字模式下移除卡片间距
    &:has(.text-mode) {
      gap: 0;
    }

    .card-cells-wrapper {
      --style: px-16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  // text-mode：紧凑文字模式，移除卡片阴影和边框
  :deep(.text-mode.article-card) {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    padding: 10px 20px;
    border-radius: 0;
    border-bottom: 1px solid var(--slax-border);

    &:hover {
      background: var(--slax-accent-bg);
      border-color: transparent;
      box-shadow: none;
      transform: none;
    }

    // 文字模式下操作按钮右侧负边距，贴近卡片右边缘
    .article-actions {
      margin-right: -10px;
    }
  }
}

.list-loading-enter-active,
.list-loading-leave-active {
  transition: transform 0.4s;
}

.list-loading-enter-from,
.list-loading-leave-to {
  --style: -translate-y-10px;
}
</style>
