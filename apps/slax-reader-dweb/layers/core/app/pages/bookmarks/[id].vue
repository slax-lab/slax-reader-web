<template>
  <div>
    <div class="bookmark-detail" ref="bookmarkDetail" v-resize-observer="[onResizeObserver, {}]">
      <DetailLayout v-if="canView || isInvalidBookmark" ref="detailLayout" :content-x-offset="contentXOffset" :animated="resizeAnimated">
        <template v-slot:panel>
          <SnapshotRightEdgeToolbar v-if="canView" v-model="activePanel" :panel-open="!!(summariesExpanded || botExpanded)" />
        </template>
        <template v-if="!!isTrashedBookmark" v-slot:tips>
          <TopTips
            :isShow="!!isTrashedBookmark"
            :tipsText="$t('page.bookmarks_detail.trash_bookmark_tips', { date: bookmarkTrashDate })"
            :buttonText="$t('page.bookmarks_detail.trash_bookmark_restore')"
            :background-color="'#FCF4E8'"
            @clickButton="trashBookmark(false)"
          />
        </template>
        <template v-slot:header>
          <SnapshotTopBar>
            <template #left>
              <button class="app-name" @click="navigateToBookmarks">{{ $t('common.app.name') }}</button>
              <ClientOnly><ProIcon /></ClientOnly>
            </template>
            <template #theme-switcher>
              <ClientOnly><ThemeSwitcher /></ClientOnly>
            </template>
            <template #right>
              <template v-if="!isTrashedBookmark && !isInvalidBookmark">
                <UserNotification :iconStyle="UserNotificationIconStyle.TINY" @checkAll="navigateToNotification" />
                <button class="topbar-share-btn" :title="$t('common.operate.share')" @click="shareUrl">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="13" cy="3" r="2" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="3" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="13" cy="13" r="2" stroke="currentColor" stroke-width="1.5" />
                    <line x1="4.89" y1="6.93" x2="11.11" y2="3.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <line x1="4.89" y1="9.07" x2="11.11" y2="12.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>
                <SnapshotMoreMenu v-if="!menuLoading" :actions="moreMenuActions" @action="moreMenuClick" />
                <div v-else class="i-svg-spinners:90-ring text-txt w-1em"></div>
              </template>
            </template>
          </SnapshotTopBar>
        </template>
        <template v-if="detail" v-slot:detail>
          <div class="detail">
            <BookmarkArticle ref="bookmarkArticle" :detail="detail" @screen-lock-update="screenLockUpdate" @bookmark-update="bookmarkUpdate" @chat-bot-quote="chatBotQuote" />
          </div>
        </template>
      </DetailLayout>
      <SnapshotBottomToolbar v-if="canView && !isTrashedBookmark" :actions="bottomToolbarActions" @action="bottomToolbarAction" />
      <template v-if="canView">
        <SidebarLayout v-model:show="summariesExpanded" width="504px" ref="summariesSidebar" :animated="resizeAnimated">
          <ClientOnly>
            <AISummaries
              v-if="bmId"
              :bookmarkId="bmId"
              :is-appeared="summariesExpanded"
              :content-selector="'.bookmark-detail .detail'"
              @navigated-text="navigateToText"
              @dismiss="summariesExpanded = false"
            />
          </ClientOnly>
        </SidebarLayout>
        <SidebarLayout v-if="!isSubscriptionExpired" v-model:show="botExpanded" width="504px" ref="botSidebar" :animated="resizeAnimated">
          <ChatBot ref="chatbot" :bookmarkId="bmId" :is-appeared="botExpanded" @dismiss="botExpanded = false" @find-quote="findQuote" />
        </SidebarLayout>
      </template>
    </div>
    <ClientOnly>
      <div class="status" v-if="!canView || isInvalidBookmark">
        <div class="loading" v-if="loading">
          <div class="i-svg-spinners:90-ring w-1em"></div>
          <span class="ml-5">{{ $t('page.bookmarks_detail.loading') }}</span>
        </div>
        <div class="not-exist" v-else-if="isTrashedBookmark">
          <span class="ml-5">{{ $t('page.bookmarks_detail.not_exists') }}</span>
        </div>
        <div class="invalid" v-else-if="isInvalidBookmark">
          <img class="w-236px object-contain -translate-x-20px" src="@images/invalid-bookmark-icon.png" alt="" />
          <span class="text-txt text-brand mt-30px font-600 line-height-28px">{{ $t('common.tips.access_unavailable.title') }}</span>
          <span class="text-txt text-body mt-16px line-height-22px">{{ $t('common.tips.access_unavailable.desc') }}</span>
          <span class="text-txt text-meta mt-8px line-height-20px">{{ $t('common.tips.access_unavailable.bookmark_footer') }}</span>
        </div>
        <div class="processing" v-else-if="detail?.status === 'pending'">
          <div class="i-svg-spinners:clock mt-1px w-1em"></div>
          <span class="ml-5">{{ $t('page.bookmarks_detail.processing') }}</span>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import AISummaries from '#layers/core/app/components/AISummaries.vue'
import BookmarkArticle from '#layers/core/app/components/Article/BookmarkArticle.vue'
import ChatBot from '#layers/core/app/components/Chat/ChatBot.vue'
import ThemeSwitcher from '#layers/core/app/components/global/ThemeSwitcher.vue'
import DetailLayout from '#layers/core/app/components/Layouts/DetailLayout.vue'
import SidebarLayout from '#layers/core/app/components/Layouts/SidebarLayout.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/app/components/Notification/UserNotification.vue'
import SnapshotBottomToolbar, { type BottomToolbarAction } from '#layers/core/app/components/Snapshot/SnapshotBottomToolbar.vue'
import SnapshotMoreMenu, { type MoreMenuAction } from '#layers/core/app/components/Snapshot/SnapshotMoreMenu.vue'
import SnapshotRightEdgeToolbar from '#layers/core/app/components/Snapshot/SnapshotRightEdgeToolbar.vue'
import SnapshotTopBar from '#layers/core/app/components/Snapshot/SnapshotTopBar.vue'
import TopTips from '#layers/core/app/components/Tips/TopTips.vue'

import { formatDate } from '@commons/utils/date'
import { RequestError } from '@commons/utils/request'

import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkDetail, BookmarkParseStatus, type EmptyBookmarkResp } from '@commons/types/interface'
import { vResizeObserver } from '@vueuse/components'
import { BookmarkPanelType } from '#layers/core/app/components/BookmarkPanel.types'
import type { QuoteData } from '#layers/core/app/components/Chat/type'
import { showEditNameModal, showShareConfigModal } from '#layers/core/app/components/Modal'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useArticleDetail } from '#layers/core/app/composables/bookmark/useArticle'
import { useBookmark } from '#layers/core/app/composables/bookmark/useBookmark'

const { t } = useI18n()
const router = useRoute()
const loading = ref(false)

const detailLayout = ref<InstanceType<typeof DetailLayout>>()
const summariesSidebar = ref<InstanceType<typeof SidebarLayout>>()
const botSidebar = ref<InstanceType<typeof SidebarLayout>>()

const bmId = Number(router.params.id)
const detail = ref<BookmarkDetail>()
const convienceArchiving = ref(false)

// 从 detail 派生加星状态（供 BottomToolbar 消费）
// 用空对象兜底，避免 useArticleDetail 内 isBookmarkDetail 对 undefined 执行 'in' 操作符报错
const detailForArticle = computed(() => (detail.value ?? {}) as BookmarkArticleDetail)
const { isStarred, allowStarred, updateStarred } = useArticleDetail(detailForArticle)

const bookmarkArticle = ref<typeof BookmarkArticle>()
const bookmarkDetail = ref<HTMLDivElement>()
const chatbot = ref<InstanceType<typeof ChatBot>>()
const isInvalidBookmark = ref(false)

const menuLoading = ref(false)

const moreMenuActions = computed<MoreMenuAction[]>(() => [
  { id: 'edit_title', label: t('common.operate.edit_title') },
  { id: 'feedback', label: t('common.operate.feedback') },
  { id: 'trash', label: t('common.operate.menu_trash'), danger: true }
])

const isTrashedBookmark = computed(() => {
  return detail.value && !!detail.value.trashed_at
})

const bookmarkTrashDate = computed(() => {
  if (!detail.value?.trashed_at) {
    return ''
  }

  return formatDate(new Date(detail.value.trashed_at), 'MM-DD')
})

const canView = computed(() => {
  return detail.value?.status === 'success'
})

const isArchieved = computed(() => {
  return !(!detail.value || detail.value?.archived === 'inbox')
})

// Phase 3：activePanel 替代旧 bookmarkPanelTypes + panelClick 双状态
const activePanel = ref<'ai' | 'chat' | 'comment' | null>(null)

// RightEdgeToolbar 切换时触发对应面板
watch(activePanel, val => {
  if (val === 'ai') showAnalyzed()
  else if (val === 'chat') showChatbot()
})

// SVG icon 字符串
const archiveIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12v2H2V4zm1 3h10v7H3V7zm3 2v3m2-3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const starIconOff = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 4H14l-3.5 2.5 1.5 4L8 10l-4 2.5 1.5-4L2 6h4.5L8 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`
const starIconOn = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 4H14l-3.5 2.5 1.5 4L8 10l-4 2.5 1.5-4L2 6h4.5L8 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="currentColor"/></svg>`
const topIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const bottomToolbarActions = computed<BottomToolbarAction[]>(() => [
  {
    id: 'archive',
    icon: archiveIcon,
    label: isArchieved.value ? t('common.operate.unarchive') : t('common.operate.archive'),
    visible: !isTrashedBookmark.value
  },
  {
    id: 'star',
    icon: isStarred.value ? starIconOn : starIconOff,
    label: isStarred.value ? t('common.tips.unstar_success') : t('common.tips.star_success'),
    active: isStarred.value,
    visible: allowStarred.value
  },
  {
    id: 'top',
    icon: topIcon,
    label: t('common.operate.top')
  }
])

const bottomToolbarAction = async (action: BottomToolbarAction) => {
  if (action.id === 'archive') {
    await archiveBookmark(isArchieved.value)
  } else if (action.id === 'star') {
    await starBookmark(!isStarred.value)
  } else if (action.id === 'top') {
    backToTop()
  }
}

const loadBookmark = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const res = await request().get<BookmarkDetail>({
      url: RESTMethodPath.BOOKMARK_DETAIL,
      query: {
        bookmark_id: String(bmId)
      },
      errorInterceptors: err => {
        if (err instanceof RequestError && err.code === 400) {
          isInvalidBookmark.value = true
        }
      }
    })

    detail.value = res
  } finally {
    loading.value = false
  }

  // 如果是快捷方式，则直接跳转
  if (detail.value?.type === 'shortcut') {
    return navigateTo(detail.value.target_url, { replace: true, external: true })
  }

  useHead({
    titleTemplate: `${detail.value?.alias_title || detail.value?.title || t('page.bookmarks_detail.no_title')} - ${t('common.app.name')}`
  })

  checkStatusInterval()
}

const {
  user,
  isSubscriptionExpired,
  resizeAnimated,
  summariesExpanded,
  botExpanded,
  contentXOffset,
  isNeedResized,
  onResizeObserver,
  showAnalyzed,
  showChatbot,
  chatBotQuote,
  showFeedback,
  backToTop,
  screenLockUpdate,
  navigateToNotification,
  navigateToBookmarks,
  navigateToText
} = useBookmark({
  detailLayout,
  summariesSidebar,
  botSidebar,
  bookmarkDetail,
  chatbot,
  typeOptions: () => {
    return {
      type: BookmarkType.Normal,
      title: detail.value?.alias_title || detail.value?.title || t('page.bookmarks_detail.no_title'),
      bmId: bmId
    }
  },
  initialRequestTask: async () => {
    await loadBookmark()
  },
  initialTasksCompleted: () => {
    nextTick(() => {
      if (!isSubscriptionExpired.value && user.value && !detailLayout.value?.isSmallScreen() && !isNeedResized.value) {
        showChatbot()
      }

      setTimeout(() => {
        resizeAnimated.value = true
      }, 0)
    })
  }
})

const checkStatusInterval = () => {
  if (!detail.value || detail.value.status !== BookmarkParseStatus.PENDING) {
    return
  }

  setTimeout(() => {
    loadBookmark()
  }, 3000)
}

const trashBookmark = async (trash: boolean) => {
  const id = detail.value?.bookmark_id
  await request().post<EmptyBookmarkResp>({
    url: trash ? RESTMethodPath.TRASH_BOOKMARK : RESTMethodPath.REVERT_BOOKMARK,
    body: {
      bookmark_id: id
    }
  })

  postChannelMessage('trashed', { id: bmId, trashed: trash })

  if (trash) {
    analyticsLog({
      event: 'bookmark_delete'
    })
  }

  if (!trash) {
    await loadBookmark()
  } else {
    Toast.showToast({
      text: t('common.tips.trash_success'),
      type: ToastType.Success
    })

    setTimeout(() => {
      navigateToBookmarks()
    }, 1000)
  }
}

const bookmarkUpdate = (updateDetail: BookmarkDetail) => {
  detail.value = updateDetail
}

const shareUrl = async () => {
  showShareConfigModal({
    bookmarkId: bmId,
    title: detail.value?.alias_title || detail.value?.title || t('page.bookmarks_detail.no_title')
  })
}

const archiveBookmark = async (isCancel: boolean) => {
  const status = !isCancel ? 'archive' : 'inbox'
  try {
    await request().post<{ bookmark_id: number; status: string }>({
      url: RESTMethodPath.BOOKMARK_ARCHIVE,
      body: {
        bookmark_id: bmId,
        status
      }
    })
    if (detail.value) {
      detail.value.archived = status
    }

    analyticsLog({
      event: 'bookmark_archive',
      is_archived: !isCancel,
      source: 'bookmark'
    })

    postChannelMessage('archive', { id: bmId, cancel: isCancel })

    Toast.showToast({
      text: t(isCancel ? 'common.tips.unarchive_success' : 'common.tips.archive_success'),
      type: ToastType.Success
    })
  } catch (e) {
    console.log(e)
    Toast.showToast({
      text: t('common.tips.operate_failed'),
      type: ToastType.Error
    })
  }
}

const convienceArchiveClick = async () => {
  if (convienceArchiving.value) {
    return
  }

  convienceArchiving.value = true
  await archiveBookmark(false)
  setTimeout(() => {
    navigateTo('/bookmarks')
    convienceArchiving.value = false
  }, 1000)
}

const findQuote = (quote: QuoteData) => {
  bookmarkArticle.value?.findQuote(quote)
}

const starBookmark = async (isStar: boolean) => {
  if (!updateStarred) return
  try {
    await updateStarred(isStar)
    postChannelMessage('star', { id: bmId, cancel: !isStar })
    Toast.showToast({
      text: t(!isStar ? 'common.tips.unstar_success' : 'common.tips.star_success'),
      type: ToastType.Success
    })
  } catch (e) {
    console.log(e)
    Toast.showToast({ text: t('common.tips.operate_failed'), type: ToastType.Error })
  }
}

const moreMenuClick = async (action: MoreMenuAction) => {
  const { id } = action
  if (id === 'edit_title') {
    const bookmark = detail.value
    if (!bookmark) {
      return
    }
    showEditNameModal({
      bookmarkId: bookmark.bookmark_id || 0,
      name: bookmark.title,
      aliasName: bookmark.alias_title,
      callback: (name: string) => {
        bookmark.alias_title = name
      }
    })
  } else if (id === 'feedback') {
    showFeedback()
  } else if (id === 'trash') {
    menuLoading.value = true
    await trashBookmark(true)
    menuLoading.value = false
  }
}

const panelClick = (type: BookmarkPanelType) => {
  switch (type) {
    case BookmarkPanelType.AI:
      showAnalyzed()
      break
    case BookmarkPanelType.CHATBOT:
      showChatbot()
      break
    case BookmarkPanelType.ARCHIVE:
      archiveBookmark(false)
      break
    case BookmarkPanelType.UNARCHIVE:
      archiveBookmark(true)
      break
    case BookmarkPanelType.TOP:
      backToTop()
      break
    case BookmarkPanelType.FEEDBACK:
      showFeedback()
      break
  }
}
</script>

<style lang="scss" scoped>
.bookmark-detail {
  // 阅读详情页归在 snapshot 档（design-system §5.1：52px），
  // 通过 override --slax-header-height 让本页的 DetailLayout .header-container（h-header）拿到 52
  --slax-header-height: var(--slax-header-h-snapshot);

  --style: w-full relative flex justify-center items-start bg-surface-solid;

  .app-name {
    --style: 'text-brand font-serif font-500 line-height-28px cursor-pointer transition-opacity duration-fast hover:opacity-80';
    color: var(--slax-text);
  }

  .topbar-share-btn {
    --style: 'w-28px h-28px flex items-center justify-center rounded-sm cursor-pointer transition-colors duration-fast';
    color: var(--slax-text-light);
    background: transparent;

    &:hover {
      color: var(--slax-text);
      background: var(--slax-accent-bg);
    }
  }

  .archive {
    --style: 'flex-center pb-60px max-md:(flex) md:(hidden)';
    button {
      --style: relative w-200px h-48px rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center cursor-auto;

      &:not(:has(.archive-loading)) {
        --style: 'hover:(opacity-90 scale-105) transition-all duration-normal cursor-pointer';
      }

      & > * {
        --style: 'not-first:ml-8px';
      }

      img {
        --style: w-20px h-20px;
      }

      span {
        --style: text-(meta txt) font-bold line-height-18px;
      }

      .archive-loading {
        --style: flex-center text-slate absolute inset-0;
      }
    }
  }
}

.status {
  --style: fixed inset-0 flex-center select-none text-(slate lg);

  .loading,
  .not-exist,
  .processing,
  .invalid {
    --style: relative p-10 flex-1 flex-center max-w-3xl min-h-screenz-100;
  }

  .invalid {
    --style: flex-col;
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
html {
  --style: bg-surface-solid;
}
</style>
