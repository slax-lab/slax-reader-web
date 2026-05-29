<template>
  <div>
    <SnapshotDetailLayout v-if="canView || isInvalidBookmark" ref="snapshotLayout" class="bookmark-detail" @close-panel="activePanel = null">
      <template #topbar>
        <SnapshotTopBar>
          <template #left>
            <button class="app-name" @click="navigateToBookmarks">{{ $t('common.app.name') }}</button>
          </template>
          <template #theme-switcher>
            <ClientOnly><ThemeSwitcher /></ClientOnly>
          </template>
          <template #right>
            <template v-if="!isTrashedBookmark && !isInvalidBookmark">
              <button class="topbar-share-btn" :title="$t('common.operate.share')" @click="shareUrl">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              </button>
              <SnapshotMoreMenu v-if="!menuLoading" :actions="moreMenuActions" @action="moreMenuClick" />
              <div v-else class="i-svg-spinners:90-ring text-txt w-1em"></div>
            </template>
          </template>
        </SnapshotTopBar>
      </template>

      <template #tips>
        <TopTips
          v-if="!!isTrashedBookmark"
          :isShow="!!isTrashedBookmark"
          :tipsText="$t('page.bookmarks_detail.trash_bookmark_tips', { date: bookmarkTrashDate })"
          :buttonText="$t('page.bookmarks_detail.trash_bookmark_restore')"
          :background-color="'#FCF4E8'"
          @clickButton="trashBookmark(false)"
        />
      </template>

      <BookmarkArticle
        v-if="detail && canView"
        ref="bookmarkArticle"
        :detail="detail"
        @screen-lock-update="screenLockUpdate"
        @bookmark-update="bookmarkUpdate"
        @chat-bot-quote="chatBotQuote"
      />

      <template #right-edge-toolbar>
        <SnapshotRightEdgeToolbar v-if="canView" v-model="activePanel" :panel-open="activePanel !== null" />
      </template>

      <template #bottom-toolbar>
        <SnapshotBottomToolbar v-if="canView && !isTrashedBookmark" :actions="bottomToolbarActions" @action="bottomToolbarAction" @more="activePanel = 'comment'" />
      </template>

      <template #side-panel>
        <SnapshotSidePanel v-if="canView" :active-tab="activePanel" @update:active-tab="activePanel = $event">
          <template #ai>
            <ClientOnly>
              <SnapshotAIPanel v-if="bmId" :bookmark-id="bmId" :is-appeared="activePanel === 'ai'" @dismiss="activePanel = null" />
            </ClientOnly>
          </template>
          <template #chat>
            <SnapshotChatPanel
              v-if="!isSubscriptionExpired"
              ref="chatbot"
              :bookmarkId="bmId"
              :is-appeared="activePanel === 'chat'"
              @dismiss="activePanel = null"
              @find-quote="findQuote"
            />
          </template>
          <template #comment>
            <ClientOnly>
              <div class="comment-panel-wrap">
                <SnapshotCommentList
                  :infos="commentInfos"
                  :active-info-id="activeInfoId"
                  :allow-action="true"
                  :user-list="detail?.marks?.user_list"
                  @card-click="onCommentCardClick"
                  @reply="onCommentReply"
                  @reply-stroke="onReplyStroke"
                />
                <SnapshotCommentComposer
                  :allow-action="true"
                  :article-selection="bookmarkArticleSelection"
                  :pending-selection="pendingSelection"
                  :pending-quote="pendingQuote"
                  :active-info-id="activeInfoId"
                  :infos="commentInfos"
                  :reply-to-uid="replyToUid"
                  @sent="onCommentSent"
                  @cancel-reply="onCancelReply"
                />
              </div>
            </ClientOnly>
          </template>
        </SnapshotSidePanel>
      </template>
    </SnapshotDetailLayout>

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
import BookmarkArticle from '#layers/core/app/components/Article/BookmarkArticle.vue'
import ThemeSwitcher from '#layers/core/app/components/global/ThemeSwitcher.vue'
import SnapshotDetailLayout from '#layers/core/app/components/Layouts/SnapshotDetailLayout.vue'
import SnapshotSidePanel from '#layers/core/app/components/Layouts/SnapshotSidePanel.vue'
import SnapshotAIPanel from '#layers/core/app/components/Snapshot/SnapshotAIPanel.vue'
import SnapshotBottomToolbar, { type BottomToolbarAction } from '#layers/core/app/components/Snapshot/SnapshotBottomToolbar.vue'
import SnapshotChatPanel from '#layers/core/app/components/Snapshot/SnapshotChatPanel.vue'
import SnapshotCommentComposer from '#layers/core/app/components/Snapshot/SnapshotCommentComposer.vue'
import SnapshotCommentList from '#layers/core/app/components/Snapshot/SnapshotCommentList.vue'
import SnapshotMoreMenu, { type MoreMenuAction } from '#layers/core/app/components/Snapshot/SnapshotMoreMenu.vue'
import SnapshotRightEdgeToolbar from '#layers/core/app/components/Snapshot/SnapshotRightEdgeToolbar.vue'
import SnapshotTopBar from '#layers/core/app/components/Snapshot/SnapshotTopBar.vue'
import TopTips from '#layers/core/app/components/Tips/TopTips.vue'

import { formatDate } from '@commons/utils/date'
import { RequestError } from '@commons/utils/request'

import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkDetail, BookmarkParseStatus, type EmptyBookmarkResp } from '@commons/types/interface'
import type { QuoteData } from '#layers/core/app/components/Chat/type'
import { showEditNameModal, showShareConfigModal } from '#layers/core/app/components/Modal'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useArticleDetail } from '#layers/core/app/composables/bookmark/useArticle'
import { useBookmark } from '#layers/core/app/composables/bookmark/useBookmark'
import { useCommentPanel } from '#layers/core/app/composables/useCommentPanel'
import { useSnapshotLayout } from '#layers/core/app/composables/useSnapshotLayout'

const { t } = useI18n()
const router = useRoute()
const loading = ref(false)

const bmId = Number(router.params.id)
const detail = ref<BookmarkDetail>()

// 从 detail 派生加星状态（供 BottomToolbar 消费）
// 用空对象兜底，避免 useArticleDetail 内 isBookmarkDetail 对 undefined 执行 'in' 操作符报错
const detailForArticle = computed(() => (detail.value ?? {}) as BookmarkArticleDetail)
const { isStarred, allowStarred, updateStarred } = useArticleDetail(detailForArticle)

const bookmarkArticle = ref<typeof BookmarkArticle>()
const chatbot = ref<InstanceType<typeof SnapshotChatPanel>>()
const isInvalidBookmark = ref(false)

// 从 BookmarkArticle 暴露的 articleSelection 实例（Phase 5 评论面板）
// Vue proxyRefs 自动解包：bookmarkArticle.value?.articleSelection 直接是 DwebArticleSelection | null
const bookmarkArticleSelection = computed(() => bookmarkArticle.value?.articleSelection ?? null)

const commentInfos = computed(() => bookmarkArticleSelection.value?.markItemInfos?.value ?? [])

const menuLoading = ref(false)

const moreMenuActions = computed<MoreMenuAction[]>(() => [
  {
    id: 'edit_title',
    label: t('common.operate.edit_title'),
    icon: `<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`
  },
  {
    id: 'feedback',
    label: t('common.operate.feedback'),
    icon: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`
  }
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

// 同步 panelOpen 到 useSnapshotLayout，驱动三档布局挤压
const { panelOpen } = useSnapshotLayout()
watch(activePanel, val => {
  panelOpen.value = val !== null
  if (val === 'ai') showAnalyzed()
  else if (val === 'chat') showChatbot()
})

// Phase 5：评论面板联动（必须在 activePanel 声明之后）
const { activeInfoId, pendingSelection, pendingQuote, focusByInfoId, flashMarkByInfoId } = useCommentPanel({
  activePanel,
  articleSelection: bookmarkArticleSelection
})

const replyToUid = ref<string | null>(null)

const onCommentCardClick = (infoId: string) => {
  flashMarkByInfoId(infoId)
}

const onCommentReply = (comment: { markUid: string }) => {
  const infos = bookmarkArticleSelection.value?.markItemInfos?.value ?? []
  for (const info of infos) {
    const found = info.comments.some(c => c.markUid === comment.markUid || c.children?.some(ch => ch.markUid === comment.markUid))
    if (found) {
      activeInfoId.value = info.id
      replyToUid.value = comment.markUid
      break
    }
  }
}

const onReplyStroke = (infoId: string) => {
  activeInfoId.value = infoId
  replyToUid.value = null
}

const onCommentSent = (infoId: string) => {
  focusByInfoId(infoId)
}

const onCancelReply = () => {
  pendingSelection.value = null
  pendingQuote.value = null
  activeInfoId.value = null
  replyToUid.value = null
}

// SVG icon 字符串
const archiveIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`
const starIconOff = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
const topIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`

const bottomToolbarActions = computed<BottomToolbarAction[]>(() => [
  {
    id: 'archive',
    icon: archiveIcon,
    label: t('common.operate.archive'),
    active: isArchieved.value,
    visible: !isTrashedBookmark.value
  },
  {
    id: 'star',
    icon: starIconOff,
    label: t('common.operate.star'),
    active: isStarred.value,
    visible: allowStarred.value
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

const { user, isSubscriptionExpired, showAnalyzed, showChatbot, chatBotQuote, showFeedback, backToTop, screenLockUpdate, navigateToNotification, navigateToBookmarks } =
  useBookmark({
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
        // 桌面态默认打开 comment tab（snapshot.md §4.3）
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
        if (!isMobile) {
          activePanel.value = 'comment'
        }
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
  await archiveBookmark(false)
  setTimeout(() => {
    navigateTo('/bookmarks')
  }, 1000)
}

const findQuote = (quote: QuoteData) => {
  bookmarkArticle.value?.findQuote(quote)
}

const starBookmark = async (isStar: boolean) => {
  if (!updateStarred.value) return
  try {
    await updateStarred.value(isStar)
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
    // contenteditable 内联编辑标题
    const titleEl = document.querySelector('.bookmark-detail .article-title') as HTMLElement
    if (!titleEl) return
    titleEl.setAttribute('contenteditable', 'true')
    titleEl.focus()
    const range = document.createRange()
    range.selectNodeContents(titleEl)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    const finish = async () => {
      titleEl.removeAttribute('contenteditable')
      titleEl.removeEventListener('blur', finish)
      titleEl.removeEventListener('keydown', onKey)
      const newTitle = titleEl.textContent?.trim() || ''
      if (newTitle && detail.value && newTitle !== (detail.value.alias_title || detail.value.title)) {
        const bookmark = detail.value
        menuLoading.value = true
        try {
          await request().post({ url: RESTMethodPath.BOOKMARK_ALIAS_TITLE, body: { bookmark_id: bookmark.bookmark_id, alias_title: newTitle } })
          bookmark.alias_title = newTitle
        } finally {
          menuLoading.value = false
        }
      }
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Enter') {
        ev.preventDefault()
        titleEl.blur()
      }
      if (ev.key === 'Escape') {
        titleEl.textContent = detail.value?.alias_title || detail.value?.title || ''
        titleEl.blur()
      }
    }
    titleEl.addEventListener('blur', finish)
    titleEl.addEventListener('keydown', onKey)
  } else if (id === 'feedback') {
    showFeedback()
  } else if (id === 'trash') {
    menuLoading.value = true
    await trashBookmark(true)
    menuLoading.value = false
  }
}

const panelClick = (_type: BookmarkPanelType) => {
  // Phase 3 后由 SnapshotRightEdgeToolbar + SnapshotBottomToolbar 接管，此函数保留供 spec stub 兼容
}
</script>

<style lang="scss" scoped>
.bookmark-detail {
  // 阅读详情页归在 snapshot 档（design-system §5.1：52px），
  // 通过 override --slax-header-height 让本页的 DetailLayout .header-container（h-header）拿到 52
  --slax-header-height: var(--slax-header-h-snapshot);

  --style: w-full relative flex justify-center items-start;

  .app-name {
    --style: 'text-brand font-serif font-500 line-height-28px cursor-pointer transition-opacity duration-fast hover:opacity-80';
    color: var(--slax-text);
  }

  .topbar-share-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--slax-text-light);
    background: transparent;

    &:hover {
      color: var(--slax-text);
      background: var(--slax-accent-bg);
    }
  }
}

.comment-panel-wrap {
  --style: h-full flex flex-col overflow-hidden;
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
