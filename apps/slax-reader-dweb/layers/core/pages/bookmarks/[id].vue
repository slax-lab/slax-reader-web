<template>
  <div>
    <div class="bookmark-detail" ref="bookmarkDetail" v-resize-observer="[onResizeObserver, {}]">
      <DetailLayout v-if="canView || isInvalidBookmark" ref="detailLayout" :content-x-offset="contentXOffset" :animated="resizeAnimated">
        <template v-slot:panel>
          <BookmarkPanel v-show="canView" :types="bookmarkPanelTypes" @panelClick="panelClick" />
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
          <div class="header">
            <div class="left">
              <button class="app-name" @click="navigateToBookmarks">{{ $t('common.app.name') }}</button>
              <ClientOnly><ProIcon /></ClientOnly>
            </div>
            <div class="right" v-if="!isTrashedBookmark && !isInvalidBookmark">
              <UserNotification :iconStyle="UserNotificationIconStyle.TINY" @checkAll="navigateToNotification" />
              <ShareBubbleTips>
                <button class="share" @click="shareUrl"></button>
              </ShareBubbleTips>
              <DotsMenu v-if="!menuLoading" :actions="menuActions" @action="menuClick" />
              <div v-else class="i-svg-spinners:90-ring w-1em text-#333333"></div>
            </div>
          </div>
        </template>
        <template v-if="detail" v-slot:detail>
          <div class="detail">
            <BookmarkArticle ref="bookmarkArticle" :detail="detail" @screen-lock-update="screenLockUpdate" @bookmark-update="bookmarkUpdate" @chat-bot-quote="chatBotQuote" />
            <div class="archive" v-if="!isArchieved">
              <button @click="convienceArchiveClick">
                <template v-if="!convienceArchiving">
                  <img src="@images/panel-item-archive.png" alt="" /> <span>{{ $t('common.operate.archive') }}</span>
                </template>
                <template v-else>
                  <div class="archive-loading">
                    <div class="i-svg-spinners:90-ring text-20px"></div>
                  </div>
                </template>
              </button>
            </div>
          </div>
        </template>
      </DetailLayout>
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
          <span class="mt-30px text-20px text-#1F1F1F font-600 line-height-28px">{{ $t('common.tips.access_unavailable.title') }}</span>
          <span class="mt-16px text-16px text-#333 line-height-22px">{{ $t('common.tips.access_unavailable.desc') }}</span>
          <span class="text-#1F1F1F) mt-8px text-14px line-height-20px">{{ $t('common.tips.access_unavailable.footer') }}</span>
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
import AISummaries from '#layers/core/components/AISummaries.vue'
import BookmarkArticle from '#layers/core/components/Article/BookmarkArticle.vue'
import BookmarkPanel, { BookmarkPanelType } from '#layers/core/components/BookmarkPanel.vue'
import ChatBot from '#layers/core/components/Chat/ChatBot.vue'
import DotsMenu, { type DotsMenuActionItem } from '#layers/core/components/DotsMenu.vue'
import DetailLayout from '#layers/core/components/Layouts/DetailLayout.vue'
import SidebarLayout from '#layers/core/components/Layouts/SidebarLayout.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/components/Notification/UserNotification.vue'
import ShareBubbleTips from '#layers/core/components/Tips/ShareBubbleTips.vue'
import TopTips from '#layers/core/components/Tips/TopTips.vue'

import { formatDate } from '@commons/utils/date'
import { RequestError } from '@commons/utils/request'

import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkDetail, BookmarkParseStatus, type EmptyBookmarkResp } from '@commons/types/interface'
import { vResizeObserver } from '@vueuse/components'
import type { QuoteData } from '#layers/core/components/Chat/type'
import { showEditNameModal, showShareConfigModal } from '#layers/core/components/Modal'
import Toast, { ToastType } from '#layers/core/components/Toast'
import { useBookmark } from '#layers/core/composables/bookmark/useBookmark'

const { t } = useI18n()
const router = useRoute()
const loading = ref(false)

const detailLayout = ref<InstanceType<typeof DetailLayout>>()
const summariesSidebar = ref<InstanceType<typeof SidebarLayout>>()
const botSidebar = ref<InstanceType<typeof SidebarLayout>>()

const bmId = Number(router.params.id)
const detail = ref<BookmarkDetail>()
const convienceArchiving = ref(false)

const bookmarkArticle = ref<typeof BookmarkArticle>()
const bookmarkDetail = ref<HTMLDivElement>()
const chatbot = ref<InstanceType<typeof ChatBot>>()
const isInvalidBookmark = ref(false)

const menuLoading = ref(false)
const menuActions = ref<DotsMenuActionItem[]>([
  { id: 'edit_title', name: t('common.operate.edit_title') },
  { id: 'trash', name: t('common.operate.menu_trash') }
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

const bookmarkPanelTypes = computed<BookmarkPanelType[]>(() => {
  return [
    BookmarkPanelType.AI,
    BookmarkPanelType.CHATBOT,
    ...(isTrashedBookmark.value ? [] : [!isArchieved.value ? BookmarkPanelType.ARCHIVE : BookmarkPanelType.UNARCHIVE]),
    BookmarkPanelType.TOP,
    BookmarkPanelType.FEEDBACK
  ]
})

const loadBookmark = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const res = await request.get<BookmarkDetail>({
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

  analyticsLog({
    event: 'view_bookmark_content',
    value: {
      user: user.value?.userId || 0,
      bookmark_id: bmId,
      source: 'bookmark',
      title: detail.value?.title || ''
    }
  })

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
  await request.post<EmptyBookmarkResp>({
    url: trash ? RESTMethodPath.TRASH_BOOKMARK : RESTMethodPath.REVERT_BOOKMARK,
    body: {
      bookmark_id: id
    }
  })

  postChannelMessage('trashed', { id: bmId, trashed: trash })

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
    await request.post<{ bookmark_id: number; status: string }>({
      url: RESTMethodPath.BOOKMARK_ARCHIVE,
      body: {
        bookmark_id: bmId,
        status
      }
    })
    if (detail.value) {
      detail.value.archived = status
    }

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

const menuClick = async (action: DotsMenuActionItem) => {
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
  --style: w-full relative flex justify-center items-start bg-#fcfcfc;

  .header {
    --style: h-full flex justify-between items-center;

    .left {
      --style: flex items-center justify-start;
      .app-name {
        --style: text-(16px #16b998) font-bold line-height-22px;
      }

      & > * {
        --style: 'not-first:ml-8px';
      }
    }

    .right {
      --style: pr-20px flex-center;

      & > *:not(:first-child) {
        --style: ml-16px;
      }

      .share {
        --style: 'w-16px h-16px hover:(scale-105) active:(scale-110) bg-cover';
        background-image: url('@images/tiny-share-icon.png');
      }
    }
  }

  .archive {
    --style: 'flex-center pb-60px max-md:(flex) md:(hidden)';
    button {
      --style: relative w-200px h-48px rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center cursor-auto;

      &:not(:has(.archive-loading)) {
        --style: 'hover:(opacity-90 scale-105) transition-all duration-250 cursor-pointer';
      }

      & > * {
        --style: 'not-first:ml-8px';
      }

      img {
        --style: w-20px h-20px;
      }

      span {
        --style: text-(15px #1f1f1f) font-bold line-height-18px;
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
  --style: bg-#fcfcfc;
}
</style>
