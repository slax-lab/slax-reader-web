<template>
  <div class="bookmarks-view">
    <div class="fixed left-0 top-0 z-100 h-0px w-full flex-center">
      <Transition name="list-loading">
        <div class="h-30px w-30px translate-y-50px rounded-full bg-#fff shadow-md flex-center -mt-30px" v-show="showRefreshLoading">
          <div class="i-svg-spinners:90-ring text-24px color-#16b998"></div>
        </div>
      </Transition>
    </div>
    <BookmarksLayout ref="bookmarksLayout">
      <template v-slot:operates>
        <div class="left-operates">
          <button class="search-icon" ref="notificationIcon" @click="!isSearching && (isShowSearchModal = true)">
            <img src="@images/tiny-search-outline-icon.png" />
          </button>
          <UserNotification @checkAll="showNotificationList" />
        </div>
        <div class="right-operates">
          <OperatesBar />
        </div>
      </template>
      <template v-slot:top-modals>
        <SearchTopModal v-model:show="isShowSearchModal" @search="text => (searchText = text)" />
        <AddUrlTopModal v-model:show="isShowTopModal" @add-url-success="addUrlSuccess" />
      </template>
      <template v-slot:sidebar-left>
        <TabsSidebar ref="tabsSidebar" :tabType="searchText ? '' : filterStatus" @change-tab="inboxClick" />
      </template>
      <template v-slot:sidebar-right>
        <div class="tools-sidebar">
          <InstallExtensionTips />
          <div class="add-url">
            <button
              @click="
                () => {
                  !isShowTopModal && (isShowTopModal = true)
                }
              "
            >
              <img src="@images/button-add-fill-circle-icon.png" alt="" />
              <span>{{ $t('page.bookmarks_index.add_url') }}</span>
            </button>
          </div>
        </div>
      </template>
      <template v-slot:content-header>
        <SearchHeader v-if="searchText" :default-search-text="searchText" @back="() => (searchText = '')" @search-status-update="status => (isSearching = status)" />
        <template v-else>
          <TagsHeader v-if="filterStatus === 'topics'" :select-tag-id="filterTopicId" :select-tag-name="filterTopicName" @select-tag="selectTopic" />
          <AsyncCollectionHeader
            v-if="filterStatus === 'collections'"
            :select-collect-id="filterCollectionId"
            :select-collect-name="filterCollectionName"
            @code-update="code => (filterCollectionCode = code)"
            @select-collect="selectCollection"
          />
          <NotificationHeader v-if="filterStatus === 'notifications'" @back="notificationBack" />
        </template>
      </template>
      <template v-slot:content-list>
        <div class="bookmarks" v-if="showList">
          <template v-if="['highlights', 'notifications'].indexOf(filterStatus) === -1">
            <TransitionGroup :name="loading ? '' : 'opacity'" @after-leave="transitionLeave">
              <BookmarkCell
                v-for="(bookmark, index) in bookmarks"
                :key="bookmark.id"
                :index="index"
                :is-subscribe="filterStatus === 'collections'"
                :bookmark="bookmark"
                :collection-code="filterCollectionCode"
                @delete="handleDelete"
                @archive-update="handleCellArchive"
                @alias-title-update="handleCellAliasTitle"
                @bookmark-update="handleCellBookmarkUpdate"
              />
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
          <div class="no-data" v-if="!loading && isDataEmpty">
            <div class="empty">
              <div class="icon" @click="checkMore"></div>
              <span>{{ $t('page.bookmarks_index.empty') }}</span>
            </div>
          </div>
          <div class="bottom-status" v-else-if="!((filterStatus === 'topics' && !filterTopicId) || (filterStatus === 'collections' && !filterCollectionId))">
            <TransitionGroup name="opacity">
              <div class="loading" v-if="loading && !isRefreshLoading">
                <div class="icon"></div>
                <span class="ml-5">{{ $t('page.bookmarks_index.more') }}</span>
              </div>
              <div class="end" v-else-if="!loading && ending">
                <div class="line"></div>
                <span class="ml-2">{{ isInTrash ? $t('page.bookmarks_index.trash_no_more') : $t('page.bookmarks_index.no_more') }}</span>
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
import AddUrlTopModal from '#layers/base/components/BookmarkList/AddUrlTopModal.vue'
import BookmarkCell from '#layers/base/components/BookmarkList/BookmarkCell.vue'
import BookmarkHighlightCell from '#layers/base/components/BookmarkList/BookmarkHighlightCell.vue'
import SearchHeader from '#layers/base/components/BookmarkList/SearchHeader.vue'
import SearchTopModal from '#layers/base/components/BookmarkList/SearchTopModal.vue'
import TabsSidebar from '#layers/base/components/BookmarkList/TabsSidebar.vue'
import TagsHeader from '#layers/base/components/BookmarkList/TagsHeader.vue'
import BookmarksLayout from '#layers/base/components/Layouts/BookmarksLayout.vue'
import NotificationCell from '#layers/base/components/Notification/NotificationCell.vue'
import NotificationHeader from '#layers/base/components/Notification/NotificationHeader.vue'
import UserNotification from '#layers/base/components/Notification/UserNotification.vue'
import InstallExtensionTips from '#layers/base/components/Tips/InstallExtensionTips.vue'

import { isSafari } from '@commons/utils/is'
import type { ChannelMessageData } from '#layers/base/utils/channel'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkItem, HighlightItem, UserInfo, UserNotificationMessageItem } from '@commons/types/interface'
import { useInfiniteScroll } from '@vueuse/core'
import { AsyncCollectionHeader } from '#layers/base/components/isolation/Payment'
import Toast from '#layers/base/components/Toast'
import useNotification from '#layers/base/composables/useNotification'
import { useUserStore } from '#layers/base/stores/user'

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
const route = useRoute()
const userStore = useUserStore()
const userInfo = ref<UserInfo>()
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
const isShowSearchModal = ref(false)
const showRefreshLoading = ref(false)
const refreshInterval = ref<NodeJS.Timeout>()

const isInTrash = computed(() => {
  return filterStatus.value === 'trashed'
})

const isRefreshLoading = computed(() => {
  return loading.value && page.value === 1
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

watch(
  () => route.query.filter,
  (newValue, oldValue) => {
    if (newValue === oldValue) {
      return
    }

    filterStatus.value = `${newValue || 'inbox'}`
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
const { reset } = useInfiniteScroll(
  window,
  () => {
    onLoadMore()
  },
  {
    distance: 100,
    canLoadMore: () => !ending.value && isActivated.value && !searchText.value
  }
)

userStore.getUserInfo({ refresh: true }).then(info => {
  userInfo.value = info
})

onMounted(() => {
  addChannelMessageHandler(chanelMessageHandler)
  !isSafari() && useNotification().requestPushPermission()
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

  reset()
}

const onLoadMore = async () => {
  if (loading.value || ending.value) return
  if ((filterStatus.value === 'topics' && filterTopicId.value < 1) || (filterStatus.value === 'collections' && filterCollectionId.value < 1)) {
    resetBookmarks()
    ending.value = true

    return
  }

  const type = filterStatus.value
  if (filterStatus.value === 'highlights') {
    const data = await loadData(queryHighlights)
    type === filterStatus.value && highlights.value.push(...(data || []))
  } else if (filterStatus.value === 'notifications') {
    const data = await loadData(queryNotifications)
    type === filterStatus.value && notifications.value.push(...(data || []))
  } else {
    const data = await loadData(queryBookmarks)
    type === filterStatus.value && bookmarks.value.push(...(data || []))
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
  return await request.get<BookmarkItem[]>({
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
  return await request.get<HighlightItem[]>({
    url: RESTMethodPath.HIGHLIGHT_LIST,
    query: {
      page: page.value,
      size: 6
    }
  })
}

const queryNotifications = async () => {
  const res = await request.get<UserNotificationMessageItem[]>({
    url: RESTMethodPath.NOTIFICATION_LIST,
    query: {
      page: page.value,
      page_size: 10
    }
  })

  if (page.value === 1) {
    request.post({ url: RESTMethodPath.NOTIFICATION_MARK_READ_ALL })
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

const showNotificationList = () => {
  inboxClick('notifications')
}

const notificationBack = () => {
  useRouter().go(-1)
}
</script>

<style lang="scss" scoped>
.bookmarks-view {
  .left-operates {
    --style: 'flex items-center max-md:(pr-16px) md:(absolute right-full pr-7px)';
    & > * {
      --style: 'not-first:ml-16px';
    }

    .search-icon {
      --style: size-24px cursor-pointer;

      img {
        --style: object-fit w-full h-full;
      }
    }
  }

  .right-operates {
    --style: 'flex items-center max-md:(justify-end) md:(justify-start flex-1)';
    & > * {
      --style: 'not-first:ml-16px';
    }
  }

  .tools-sidebar {
    --style: absolute bottom-120px left-16px w-full flex flex-col justify-end;
    .add-url {
      --style: 'mt-24px bg-#fcfcfc border-(1px solid #a8b1cd3d) rounded-8px w-68px h-82px py-5px px-5px';
      button {
        --style: 'w-full h-full rounded-8px flex-(col center) hover:(bg-#f5f5f3) transition-all duration-250 active:(scale-105)';
        img {
          --style: object-fit w-24px h-24px;
        }

        span {
          --style: mt-4px text-(10px #999999) line-height-14px;
        }
      }
    }
  }

  .bookmarks {
    --style: relative pt-20px;

    &:not(:has(.card-cells-wrapper)) {
      --style: 'max-md:(pr-32px)';
    }

    .card-cells-wrapper {
      --style: px-16px;
    }
  }

  .no-data {
    --style: pb-52px text-(12px #999999) select-none relative shrink-0;
    .empty {
      --style: relative pt-168px flex-col items-center h-full flex-center;
      .icon {
        --style: bg-contain w-60px h-75px shrink-0;
        background-image: url('@images/logo-bg-gray.png');
      }

      span {
        --style: mt-24px text-14px lien-height-22px;
      }
    }
  }

  .bottom-status {
    --style: py-52px text-(12px #999999) select-none relative shrink-0;

    & > * {
      --style: flex-center absolute inset-0;
    }

    .loading {
      .icon {
        --style: 'i-svg-spinners:90-ring';
      }
    }

    .end {
      .line {
        --style: w-36px h-1px bg-#a8b1cd3d;
      }

      span {
        --style: mx-12px text-align-center;
      }
    }

    .icon {
      --style: 'cursor-pointer transition-transform duration-200 hover:scale-120 text-13px';
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
body {
  --style: 'max-md:(bg-#fcfcfc) md:(bg-#fcfcfc)';
}
</style>
