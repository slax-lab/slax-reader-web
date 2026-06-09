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

        <BookmarkListContent
          v-if="showList"
          :filter-status="filterStatus"
          :grouped-bookmarks="groupedBookmarks"
          :highlights="highlights"
          :notifications="notifications"
          :list-mode="listMode"
          :loading="loading"
          :filter-collection-code="filterCollectionCode"
          @delete="handleDelete"
          @archive-update="handleCellArchive"
          @alias-title-update="handleCellAliasTitle"
          @bookmark-update="handleCellBookmarkUpdate"
          @transition-leave="transitionLeave"
        />
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
definePageMeta({ alias: ['/'] })

import AddUrlTopModal from '#layers/core/app/components/BookmarkList/AddUrlTopModal.vue'
import BookmarkListContent from '#layers/core/app/components/BookmarkList/BookmarkListContent.vue'
import BookmarksContentHeader from '#layers/core/app/components/BookmarkList/BookmarksContentHeader.vue'
import BookmarksEmptyState from '#layers/core/app/components/BookmarkList/BookmarksEmptyState.vue'
import BookmarksFab from '#layers/core/app/components/BookmarkList/BookmarksFab.vue'
import ListBottomStatus from '#layers/core/app/components/BookmarkList/ListBottomStatus.vue'
import ListLayoutSwitcher from '#layers/core/app/components/BookmarkList/ListLayoutSwitcher.vue'
import TabsSidebar from '#layers/core/app/components/BookmarkList/TabsSidebar.vue'
import BookmarksLayout from '#layers/core/app/components/Layouts/BookmarksLayout.vue'

import { isSafari } from '@commons/utils/is'

import { showFeedbackModal } from '#layers/core/app/components/Modal'
import Toast from '#layers/core/app/components/Toast'
import { useBookmarkData } from '#layers/core/app/composables/bookmark/useBookmarkData'
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
const route = useRoute()
const userStore = useUserStore()

const searchText = ref('')
const isSearching = ref(false)
const isShowTopModal = ref(false)

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

// 列表数据层：state + 分页 + 无限滚动 + 派生计算 + cell handlers + 频道同步
const {
  highlights,
  notifications,
  loading,
  ending,
  isTransitioning,
  isFirstLoad,
  groupedBookmarks,
  isRefreshLoading,
  lastUpdatedText,
  isDataEmpty,
  showList,
  onLoadMore,
  resetBookmarks,
  reloadList,
  handleCellArchive,
  handleCellAliasTitle,
  handleCellBookmarkUpdate,
  handleDelete,
  transitionLeave
} = useBookmarkData(
  {
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
  },
  searchText
)

// 列表布局模式（card / text），localStorage 持久化
const { listMode } = useListLayoutMode()

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

// 页面级滚动位置：切换 tab 退出搜索态时归零（无限滚动逻辑在 useBookmarkData 内）
const { y } = useScroll(window, { behavior: 'smooth', throttle: 10 })

userStore.getUserInfo({ refresh: true })

onMounted(() => {
  !isSafari() && useNotification().requestPushPermission()
  addLog()
})

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
.list-loading-enter-active,
.list-loading-leave-active {
  transition: transform 0.4s;
}

.list-loading-enter-from,
.list-loading-leave-to {
  --style: -translate-y-10px;
}
</style>
