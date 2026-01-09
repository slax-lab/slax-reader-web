<template>
  <div>
    <div class="bookmark-detail" ref="bookmarkDetail" v-resize-observer="[onResizeObserver, {}]">
      <DetailLayout ref="detailLayout" :content-x-offset="contentXOffset" :animated="resizeAnimated">
        <template v-slot:panel>
          <BookmarkPanel v-show="detail" :types="bookmarkPanelTypes" @panelClick="panelClick" />
        </template>
        <template v-slot:tips>
          <ClientOnly>
            <TopTips
              v-show="detail"
              :is-show="true"
              :button-enabled="isShowTransferButton"
              :tipsText="shareText"
              :buttonText="isShowTransferButton === undefined ? '' : isShowTransferButton ? $t('page.share_detail.transfer_save') : $t('page.share_detail.transfered_save')"
              :buttonTextColor="isShowTransferButton ? '#5490C2' : '#999999'"
              :background-color="'#EDF8F2'"
              @clickButton="transferSaveClick"
            >
              <template #left>
                <img class="user-icon" v-if="!detail?.user_info?.avatar" src="@images/user-default-avatar.png" alt="" />
                <img class="user-icon" v-else :src="detail.user_info.avatar" alt="" />
              </template>
            </TopTips>
          </ClientOnly>
        </template>
        <template v-slot:header>
          <div class="header">
            <div class="left">
              <button class="app-name" @click="navigateToBookmarks">Slax Reader</button>
              <ClientOnly><ProIcon /></ClientOnly>
            </div>
            <ClientOnly>
              <UserNotification v-if="user" :iconStyle="UserNotificationIconStyle.TINY" @checkAll="navigateToNotification" />
            </ClientOnly>
          </div>
        </template>
        <template v-slot:detail>
          <BookmarkArticle
            v-if="detail"
            ref="bookmarkArticle"
            :detail="detail"
            :marks="marks"
            @screen-lock-update="screenLockUpdate"
            @bookmark-update="bookmarkUpdate"
            @chat-bot-quote="chatBotQuote"
          />
          <ClientOnly>
            <div class="login">
              <GoogleLoginButton ref="googleLoginBtn" v-if="!user" :redirect="redirectHref" />
            </div>
          </ClientOnly>
        </template>
      </DetailLayout>
      <ClientOnly>
        <SidebarLayout v-model:show="summariesExpanded" width="504px" ref="summariesSidebar" :animated="resizeAnimated">
          <ClientOnly>
            <AISummaries
              :share-code="shareCode"
              :is-appeared="summariesExpanded"
              :content-selector="'.bookmark-detail .detail'"
              @navigated-text="navigateToText"
              @dismiss="summariesExpanded = false"
            />
          </ClientOnly>
        </SidebarLayout>
        <SidebarLayout v-if="!isSubscriptionExpired" v-model:show="botExpanded" width="504px" ref="botSidebar" :animated="resizeAnimated">
          <ChatBot ref="chatbot" :share-code="shareCode" :is-appeared="botExpanded" @dismiss="botExpanded = false" @find-quote="findQuote" />
        </SidebarLayout>
      </ClientOnly>
    </div>
    <ClientOnly>
      <div class="status" v-if="loading">
        <div class="loading" v-if="loading">
          <div class="i-svg-spinners:90-ring w-1em"></div>
          <span class="ml-5">{{ $t('page.bookmarks_detail.loading') }}</span>
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
import GoogleLoginButton from '#layers/core/components/GoogleLoginButton.vue'
import DetailLayout from '#layers/core/components/Layouts/DetailLayout.vue'
import SidebarLayout from '#layers/core/components/Layouts/SidebarLayout.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/components/Notification/UserNotification.vue'
import TopTips from '#layers/core/components/Tips/TopTips.vue'

import { formatDate } from '@commons/utils/date'
import { isClient, isServer } from '@commons/utils/is'
import { extractHTMLTextContent } from '@commons/utils/parse'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkExistsResp, MarkDetail, ShareBookmarkDetail } from '@commons/types/interface'
import { vResizeObserver } from '@vueuse/components'
import type { QuoteData } from '#layers/core/components/Chat/type'
import Toast, { ToastType } from '#layers/core/components/Toast'
import { useBookmark } from '#layers/core/composables/bookmark/useBookmark'

const { t } = useI18n()
const router = useRoute()
const loading = ref(false)

const detailLayout = ref<InstanceType<typeof DetailLayout>>()
const summariesSidebar = ref<InstanceType<typeof SidebarLayout>>()
const botSidebar = ref<InstanceType<typeof SidebarLayout>>()

const googleLoginBtn = ref<InstanceType<typeof GoogleLoginButton>>()
const shareCode = String(router.params.id)
const detail = ref<ShareBookmarkDetail>()
const marks = ref<MarkDetail>()

const bookmarkArticle = ref<InstanceType<typeof BookmarkArticle>>()
const bookmarkDetail = ref<HTMLDivElement>()
const chatbot = ref<InstanceType<typeof ChatBot>>()

const isShowTransferButton = ref<boolean>()

const shareText = computed(() => {
  return t('page.share_detail.share_text', {
    user: detail.value?.user_info?.nick_name,
    date: formatDate(new Date(detail.value?.share_info?.created_at || ''), 'YYYY-MM-DD')
  })
})

const bookmarkPanelTypes = computed<BookmarkPanelType[]>(() => {
  return [BookmarkPanelType.AI, BookmarkPanelType.CHATBOT, BookmarkPanelType.TOP, BookmarkPanelType.FEEDBACK]
})

const defineSeo = () => {
  if (!detail.value) {
    return
  }

  const wordText = extractHTMLTextContent(detail.value?.content || '')
  const title = `${detail.value?.title} - ${t('common.app.name')}`
  const description = wordText.length < 60 ? wordText : wordText.slice(0, 60)

  useHead({
    titleTemplate: `${detail.value?.title} - ${t('common.app.name')}`
  })

  useSeoMeta({
    title,
    description,
    ogType: 'article',
    ogDescription: description,
    applicationName: t('common.app.name'),
    author: detail.value?.user_info.nick_name,
    twitterTitle: title,
    twitterDescription: description
  })

  defineArticle({
    headline: title,
    description,
    image: detail.value?.user_info.avatar,
    datePublished: detail.value?.share_info.created_at,
    '@type': ['Article']
  })
}

const loadMarks = async () => {
  try {
    const res = await request().get<MarkDetail>({
      url: RESTMethodPath.SHARE_BOOKMARK_MARK_LIST,
      query: {
        share_code: shareCode
      }
    })

    marks.value = res
  } catch (error) {
    marks.value = {
      mark_list: [],
      user_list: {}
    }
  }
}

const loadBookmarkDetail = async () => {
  if (!detail.value) {
    const data = await request().get<ShareBookmarkDetail>({
      url: RESTMethodPath.SHARE_BOOKMARK_DETAIL,
      query: {
        share_code: shareCode
      }
    })

    data && (detail.value = data)
  }

  await loadMarks()

  analyticsLog({
    event: 'view_bookmark_content',
    value: {
      user: user.value?.userId || 0,
      share_code: shareCode,
      source: 'share',
      title: detail.value?.title || ''
    }
  })
}

const fetchServerData = async () => {
  const { data } = await useAsyncData('detail', () =>
    request().get<ShareBookmarkDetail>({
      url: RESTMethodPath.SHARE_BOOKMARK_DETAIL,
      query: {
        share_code: shareCode
      }
    })
  )

  data.value && (detail.value = data.value)
}

const renderServerData = async () => {
  try {
    isServer &&
      defineOgImageComponent('Share', {
        title: `${detail.value?.title || ''}`
      })

    defineSeo()
  } catch (error) {
    console.error(error)
  }
}

await fetchServerData()
await renderServerData()

const {
  user,
  isSubscriptionExpired,
  redirectHref,
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
  loginVerify,
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
      type: BookmarkType.Share,
      title: detail.value?.title || '',
      shareCode
    }
  },
  initialRequestTask: async () => {
    if (!isClient) {
      return
    }

    await loadBookmarkDetail()
  },
  initialTasksCompleted: () => {
    if (!isClient) {
      return
    }

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

const checkShowTransferButton = () => {
  request()
    .post<BookmarkExistsResp>({
      url: RESTMethodPath.BOOKMARK_EXISTS,
      body: {
        target_url: location.href
      }
    })
    .then(res => {
      isShowTransferButton.value = !res?.exists
    })
}

if (isClient) {
  watch(
    () => user.value,
    (value, oldValue) => {
      if (value && value.userId !== oldValue?.userId) {
        checkShowTransferButton()
      }
    },
    { immediate: true }
  )
}

const bookmarkUpdate = (updateDetail: ShareBookmarkDetail) => {
  detail.value = updateDetail
}

const findQuote = (quote: QuoteData) => {
  bookmarkArticle.value?.findQuote(quote)
}

const transferSaveClick = () => {
  if (!loginVerify()) {
    return
  }

  request()
    .post<{ bmId: number }>({
      url: RESTMethodPath.ADD_URL_BOOKMARK,
      body: {
        target_url: location.href
      }
    })
    .then(res => {
      !!res?.bmId && (isShowTransferButton.value = false)
      Toast.showToast({
        text: t('common.tips.transfer_save_success'),
        type: ToastType.Success
      })
    })
}

const panelClick = (type: BookmarkPanelType) => {
  switch (type) {
    case BookmarkPanelType.AI:
      showAnalyzed()
      break
    case BookmarkPanelType.CHATBOT:
      showChatbot()
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
  --style: w-full min-h-screen relative flex justify-center items-start bg-#fcfcfc;

  .user-icon {
    --style: 'rounded-full border-(1px #ffffff solid) w-24px h-24px relative overflow-hidden cursor-pointer transition-transform duration-250 hover:scale-102 active:scale-105';
    img {
      --style: absolute w-full h-full top-0 left-0 object-contain;
    }
  }

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
  }

  .login {
    --style: flex-center mt-0 pb-170px;
  }
}

.status {
  --style: fixed inset-0 flex-center;

  .loading {
    --style: relative p-10 flex-1 flex-center max-w-3xl min-h-screen text-(slate lg) z-100;
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
html {
  --style: bg-#fcfcfc;
}
</style>
