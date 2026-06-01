<template>
  <div class="bookmarks-view">
    <div class="fixed left-0 top-0 z-100 h-0px w-full flex-center">
      <Transition name="list-loading">
        <div class="bg-surface-solid h-30px w-30px translate-y-50px rounded-full shadow-md flex-center -mt-30px" v-show="showRefreshLoading">
          <!-- color-#16b998 当前品牌绿 loading spinner，保留 -->
          <div class="i-svg-spinners:90-ring text-h2 color-#16b998"></div>
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
        <SearchHeader v-if="searchText" :default-search-text="searchText" @back="() => (searchText = '')" @search-status-update="status => (isSearching = status)" />
        <template v-else>
          <TagsHeader v-if="filterStatus === 'topics'" :select-tag-id="filterTopicId" :select-tag-name="filterTopicName" @select-tag="selectTopic" />
          <CollectionHeader
            v-if="filterStatus === 'collections'"
            :select-collect-id="filterCollectionId"
            :select-collect-name="filterCollectionName"
            @code-update="(code: string) => (filterCollectionCode = code)"
            @select-collect="selectCollection"
          />
          <NotificationHeader v-if="filterStatus === 'notifications'" @back="notificationBack" />
        </template>
      </template>
      <template v-slot:content-list>
        <!-- 布局切换器：非搜索、非 highlights/notifications、非话题未选标签时显示 -->
        <div class="page-toolbar" v-if="!searchText && !['highlights', 'notifications'].includes(filterStatus) && !(filterStatus === 'topics' && !filterTopicId)">
          <p class="page-subtitle" v-if="lastUpdatedText">{{ lastUpdatedText }}</p>
          <div v-else />
          <div class="layout-switcher">
            <!-- 文字列表：三条横线 icon（对齐 demo） -->
            <button class="layout-btn" :class="{ active: listMode === 'text' }" @click="listMode = 'text'" :title="$t('page.bookmarks_index.layout_text')" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
            <div class="layout-divider" />
            <!-- 卡片列表：两个横向矩形 icon（对齐 demo） -->
            <button class="layout-btn" :class="{ active: listMode === 'card' }" @click="listMode = 'card'" :title="$t('page.bookmarks_index.layout_card')" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="7" rx="2" />
                <rect x="3" y="14" width="18" height="7" rx="2" />
              </svg>
            </button>
          </div>
        </div>

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
          <div v-if="!loading && isDataEmpty">
            <!-- inbox 空态：QuickStart 引导（PC）或通用空态 -->
            <template v-if="isCurrentInboxTab && isPC() && !isFirstLoad">
              <div class="quick-start-wrap">
                <QuickStart />
              </div>
            </template>
            <!-- 其他 tab 空态：新版 BookmarksEmptyView -->
            <template v-else>
              <BookmarksEmptyView :title="emptyViewConfig.title" :desc="emptyViewConfig.desc">
                <template #icon>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" v-html="emptyViewConfig.iconPath" />
                </template>
              </BookmarksEmptyView>
            </template>
          </div>
          <div class="bottom-status" v-else-if="!((filterStatus === 'topics' && !filterTopicId) || (filterStatus === 'collections' && !filterCollectionId))">
            <TransitionGroup name="opacity">
              <div class="loading" v-if="loading && !isRefreshLoading">
                <div class="icon"></div>
                <span class="ml-5">{{ $t('page.bookmarks_index.more') }}</span>
              </div>
              <div class="end" v-else-if="!loading && ending">
                <div class="line"></div>
                <span>{{ isInTrash ? $t('page.bookmarks_index.trash_no_more') : $t('page.bookmarks_index.no_more') }}</span>
                <div class="line"></div>
              </div>
            </TransitionGroup>
          </div>
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
import BookmarksEmptyView from '#layers/core/app/components/BookmarkList/BookmarksEmptyView.vue'
import BookmarksFab from '#layers/core/app/components/BookmarkList/BookmarksFab.vue'
import SearchHeader from '#layers/core/app/components/BookmarkList/SearchHeader.vue'
import TabsSidebar from '#layers/core/app/components/BookmarkList/TabsSidebar.vue'
import TagsHeader from '#layers/core/app/components/BookmarkList/TagsHeader.vue'
import BookmarksLayout from '#layers/core/app/components/Layouts/BookmarksLayout.vue'
import NotificationCell from '#layers/core/app/components/Notification/NotificationCell.vue'
import NotificationHeader from '#layers/core/app/components/Notification/NotificationHeader.vue'
import QuickStart from '#layers/core/app/components/QuickStart.vue'
import InstallExtensionTips from '#layers/core/app/components/Tips/InstallExtensionTips.vue'

import { isPC, isSafari } from '@commons/utils/is'
import type { ChannelMessageData } from '#layers/core/app/utils/channel'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkItem, HighlightItem, UserNotificationMessageItem } from '@commons/types/interface'
import { useDebounceFn, useEventListener, useInfiniteScroll } from '@vueuse/core'
import { showFeedbackModal } from '#layers/core/app/components/Modal'
import Toast from '#layers/core/app/components/Toast'
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
const filterStatus = ref(`${route.query.filter || 'inbox'}`)
const filterTopicId = ref(Number(route.query.topic_id || ''))
const filterTopicName = ref(`${route.query.topic_name || ''}`)

const filterCollectionId = ref(Number(route.query.c_id || ''))
const filterCollectionCode = ref<string>(String(route.query.c_code || ''))
const filterCollectionName = ref<string>(String(route.query.c_name || ''))

const searchText = ref('')
const isSearching = ref(false)

const isTransitioning = ref(false)
const highlights = ref<HighlightItem[]>([])
const notifications = ref<UserNotificationMessageItem[]>([])

const isShowTopModal = ref(false)
const showRefreshLoading = ref(false)
const refreshInterval = ref<NodeJS.Timeout>()

// 列表布局模式：'card'（卡片）| 'text'（紧凑文字），localStorage 持久化
const listMode = ref<'card' | 'text'>(import.meta.client ? (localStorage.getItem('slax-list-mode') as 'card' | 'text') || 'card' : 'card')
watch(listMode, v => {
  if (import.meta.client) {
    localStorage.setItem('slax-list-mode', v)
  }
})

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

const isInTrash = computed(() => {
  return filterStatus.value === 'trashed'
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

// 各 tab 空数据视图配置（icon path + 标题 + 描述）
const emptyViewConfig = computed(() => {
  const configs: Record<string, { iconPath: string; title: string; desc: string }> = {
    starred: {
      iconPath: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      title: t('page.bookmarks_index.empty_starred_title'),
      desc: t('page.bookmarks_index.empty_starred_desc')
    },
    topics: {
      iconPath:
        '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      title: t('page.bookmarks_index.empty_topics_title'),
      desc: t('page.bookmarks_index.empty_topics_desc')
    },
    highlights: {
      iconPath: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      title: t('page.bookmarks_index.empty_highlights_title'),
      desc: t('page.bookmarks_index.empty_highlights_desc')
    },
    archive: {
      iconPath: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
      title: t('page.bookmarks_index.empty_archive_title'),
      desc: t('page.bookmarks_index.empty_archive_desc')
    },
    trashed: {
      iconPath: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>',
      title: t('page.bookmarks_index.empty_trash_title'),
      desc: t('page.bookmarks_index.empty_trash_desc')
    },
    collections: {
      iconPath: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
      title: t('page.bookmarks_index.empty_collections_title'),
      desc: t('page.bookmarks_index.empty_collections_desc')
    },
    notifications: {
      iconPath: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
      title: t('page.bookmarks_index.empty_notifications_title'),
      desc: t('page.bookmarks_index.empty_notifications_desc')
    }
  }
  return (
    configs[filterStatus.value] ?? {
      iconPath: '<circle cx="12" cy="12" r="10"/>',
      title: t('page.bookmarks_index.empty'),
      desc: ''
    }
  )
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

const isCurrentInboxTab = computed(() => {
  return filterStatus.value === 'inbox' || !Boolean(filterStatus.value)
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

watch(
  () => isRefreshLoading.value,
  value => {
    if (value) {
      refreshInterval.value = setTimeout(() => {
        showRefreshLoading.value = true
      }, 250)
    } else {
      refreshInterval.value && clearTimeout(refreshInterval.value)
      showRefreshLoading.value = false
    }
  }
)

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

const selectTopic = async (info: { id: number; name: string } | null) => {
  resetBookmarks()
  const topicParams: Record<string, number | string> = {}
  if (info) {
    info.id && (topicParams.topic_id = info.id)
  }

  filterTopicId.value = info?.id || 0
  filterTopicName.value = info?.name || ''

  const paramsStr = Object.keys(topicParams)
    .map(key => `${key}=${topicParams[key]}`)
    .join('&')

  await navigateTo(`/bookmarks?filter=topics${paramsStr.length > 0 ? '&' + paramsStr : ''}`, {
    replace: true
  })

  await onLoadMore()
}

const selectCollection = async (info: { id: number; name: string; code: string } | null) => {
  resetBookmarks()
  const collectParams: Record<string, number | string> = {}
  if (info) {
    info.id && (collectParams.c_id = info.id)
    info.name && (collectParams.c_name = info.name)
    info.code && (collectParams.c_code = info.code)
  }

  filterCollectionId.value = info?.id || 0
  filterCollectionCode.value = info?.code || ''
  filterCollectionName.value = info?.name || ''

  const paramsStr = Object.keys(collectParams)
    .map(key => `${key}=${collectParams[key]}`)
    .join('&')

  await navigateTo(`/bookmarks?filter=collections${paramsStr.length > 0 ? '&' + paramsStr : ''}`, {
    replace: true
  })

  await onLoadMore()
}

const inboxClick = async (type: string, index?: number) => {
  if (searchText.value) {
    searchText.value = ''
    y.value = 0
  }

  if (type === filterStatus.value) {
    return
  }

  resetBookmarks()
  filterStatus.value = type
  filterCollectionId.value = 0
  filterTopicId.value = 0
  await navigateTo(`/bookmarks?filter=${type}`, {
    replace: type !== 'notifications'
  })

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
  // 布局切换器工具栏
  .page-toolbar {
    --style: flex items-center justify-between mb-16px px-4px;
  }

  .page-subtitle {
    font-size: 13px;
    color: var(--slax-text-light);
    font-weight: 300;
    margin: 0;
  }

  .layout-switcher {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .layout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--slax-text-light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    outline: none;

    &:hover {
      color: var(--slax-text-muted);
    }

    &.active {
      color: var(--slax-text);
    }
  }

  .layout-divider {
    width: 1px;
    height: 14px;
    background: var(--slax-border);
  }

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

  .quick-start-wrap {
    --style: max-w-572px mt-24px mx-auto;
  }

  .bottom-status {
    --style: select-none relative shrink-0;
    padding: 48px 0 0;
    text-align: center;

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--slax-text-light);
      font-size: 13px;

      .icon {
        --style: 'i-svg-spinners:90-ring text-aux';
      }
    }

    .end {
      // demo 同款：斜体衬线字体，淡色
      font-family: var(--slax-font-serif);
      font-size: 13px;
      color: var(--slax-text-light);
      font-weight: 300;
      font-style: italic;

      // 隐藏旧的两条线
      .line {
        display: none;
      }

      span {
        --style: mx-0;
      }
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

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
/* 列表页专属背景：override body 背景色和氛围渐变，随主题切换 */
body {
  background: #faf8f2;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(at 30% 0%, #faf5eb 0%, transparent 50%), radial-gradient(at 80% 20%, #f6efe4 0%, transparent 60%), radial-gradient(at 50% 80%, #f8efe4 0%, transparent 40%);
  z-index: -1;
  pointer-events: none;
}

[data-slax-theme='dark'] body {
  background: #141210;
}

[data-slax-theme='dark'] body::before {
  background:
    radial-gradient(at 30% 0%, #1e1810 0%, transparent 50%), radial-gradient(at 80% 20%, #1a1612 0%, transparent 60%), radial-gradient(at 50% 80%, #181410 0%, transparent 40%);
}

[data-slax-theme='eink'] body {
  background: #ffffff;
}

[data-slax-theme='eink'] body::before {
  display: none;
}
</style>
