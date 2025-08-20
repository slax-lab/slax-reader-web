<template>
  <PanelView :show-panel="showPanel" @close="closePanel" v-if="!needHidden">
    <template #content>
      <Transition name="sidepanel">
        <div class="dark px-20px" v-show="isSummaryShowing">
          <AIOverview v-if="bookmarkBriefInfo" :bookmark-brief-info="bookmarkBriefInfo" :isAppeared="isSummaryShowing" />
          <AISummaries :key="currentUrl" ref="summaries" :bookmarkId="bookmarkId" :isAppeared="isSummaryShowing" :close-button-hidden="true" @dismiss="closePanel" />
        </div>
      </Transition>
      <Transition name="sidepanel">
        <div class="dark size-full" v-show="isChatbotShowing">
          <ChatBot
            :key="currentUrl"
            ref="chatbot"
            :bookmarkId="bookmarkId"
            :isAppeared="isChatbotShowing"
            :close-button-hidden="true"
            @dismiss="closePanel"
            @find-quote="findQuote"
          />
        </div>
      </Transition>
      <Transition name="sidepanel">
        <div class="dark size-full" v-show="isCommentShowing">
          <ArticleCommentsView
            v-if="userInfo && articleSelection"
            :key="currentUrl"
            ref="comments"
            :selection="articleSelection"
            :isAppeared="isCommentShowing"
            :bookmark-user-id="userInfo.userId"
          />
        </div>
      </Transition>
    </template>
    <template #tabbars>
      <div class="button-wrapper" v-for="panel in subPanelItems" :key="panel.type">
        <button @click="panelClick(panel)">
          <Transition name="opacity">
            <div class="selected-bg" v-show="panel.isSelected && panel.isSelected()"></div>
          </Transition>
          <div class="icon-wrapper">
            <div class="icon">
              <template v-if="!(panel.isSelected && panel.isSelected()) || !panel.selectedIcon">
                <img class="normal" :src="panel.icon" alt="" />
                <img class="highlighted" :src="panel.highlighedIcon" alt="" />
              </template>
              <template v-else>
                <img class="selected" :src="panel.selectedIcon" alt="" />
              </template>
            </div>
          </div>
        </button>
      </div>
    </template>
    <template #operate>
      <PanelOperate :is-star="bookmarkBriefInfo?.starred === 'star'" :is-archive="bookmarkBriefInfo?.archived === 'archive'" @action="panelClick" />
    </template>
  </PanelView>
  <div class="web-panel" v-if="!needHidden">
    <SidebarTips>
      <SidebarItems
        :is-summary-showing="isSummaryShowing"
        :is-chatbot-showing="isChatbotShowing"
        :is-comment-showing="isCommentShowing"
        :is-star="bookmarkBriefInfo?.starred === 'star'"
        :is-archive="bookmarkBriefInfo?.archived === 'archive'"
        @panel-item-action="panelClick"
      />
    </SidebarTips>
  </div>
  <div class="slax-menus" ref="menus" v-if="!needHidden"></div>
  <div class="slax-custom-container" ref="modalContainer"></div>
</template>

<script lang="ts" setup>
import AISummaries from './AISummaries.vue'
import ChatBot from './Chat/ChatBot.vue'
import PanelOperate from './PanelOperate.vue'
import SidebarItems from './SidebarItems.vue'
import SidebarTips from './Tips/SidebarTips.vue'
import AIOverview from './AIOverview.vue'
import PanelView from './PanelView.vue'
import ArticleCommentsView from './Selection/ArticleCommentsView.vue'

import { type MessageType, MessageTypeAction } from '@/config/message'
import { Images, type PanelItem, PanelItemType } from '@/config/panel'

import { RequestError, RequestMethodType } from '@commons/utils/request'

import type { QuoteData } from './Chat/type'
import { showFeedbackModal, showShareConfigModal } from './Modal'
import { ArticleSelection } from './Selection/selection'
import { RESTMethodPath } from '@commons/types/const'
import type { AddBookmarkReq, AddBookmarkResp, BookmarkBriefDetail, UserInfo } from '@commons/types/interface'
import type { WxtBrowser } from 'wxt/browser'
import { onKeyStroke } from '@vueuse/core'
import type { MarkCommentInfo, MarkItemInfo } from './Selection/type'

const props = defineProps({
  browser: {
    type: Object as PropType<WxtBrowser>,
    required: true
  }
})

const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
const isCollected = ref(false)
const subPanelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: Images.ai.sub,
    highlighedIcon: Images.ai.highlighted,
    selectedIcon: Images.ai.selected,
    title: $t('component.sidebar.ai'),
    hovered: false,
    isSelected: () => isSummaryShowing.value
  },
  {
    type: PanelItemType.Chat,
    icon: Images.chatbot.sub,
    highlighedIcon: Images.chatbot.highlighted,
    selectedIcon: Images.chatbot.selected,
    title: $t('component.sidebar.chat'),
    hovered: false,
    isSelected: () => isChatbotShowing.value
  },
  {
    type: PanelItemType.Comments,
    icon: Images.comments.sub,
    highlighedIcon: Images.comments.highlighted,
    selectedIcon: Images.comments.selected,
    title: $t('component.sidebar.comments'),
    hovered: false,
    isSelected: () => isCommentShowing.value
  }
])

const menus = ref<HTMLDivElement>()
const modalContainer = useTemplateRef<HTMLDivElement>('modalContainer')

const summaries = ref<InstanceType<typeof AISummaries>>()
const chatbot = ref<InstanceType<typeof ChatBot>>()
const comments = ref<InstanceType<typeof ArticleCommentsView>>()

const bookmarkId = ref(0)
const bookmarkUrl = ref('')
const currentUrl = ref(window.location.href)
const bookmarkBriefInfo = ref<BookmarkBriefDetail | null>(null)

const lastOpenItem = ref<PanelItemType>()
const isSummaryShowing = ref(false)
const isChatbotShowing = ref(false)
const isCommentShowing = ref(false)

const isLoading = ref(false)

let articleSelection: ArticleSelection | null = null

const userInfo = ref<UserInfo | null>(null)

const showPanel = computed(() => {
  return isSummaryShowing.value || isChatbotShowing.value || isCommentShowing.value
})

const needHidden = computed(() => {
  return isSlaxWebsite(currentUrl.value) || bookmarkId.value === 0
})

watch(
  () => bookmarkId.value,
  value => {
    if (!value) {
      bookmarkBriefInfo.value = null
      unloadSelection()
      return
    }

    loadBriefDetail().then(() => {
      loadSelection()
    })
  }
)

props.browser.runtime.onMessage.addListener(
  (message: unknown, sender: Browser.runtime.MessageSender, sendResponse: (response?: 'string' | Record<string, string | number>) => void) => {
    console.log('receive message', message, sender)

    const receiveMessage = message as MessageType
    switch (receiveMessage.action) {
      case MessageTypeAction.PageUrlUpdate: {
        const url = receiveMessage.url
        if (url !== bookmarkUrl.value) {
          updateBookmarkStatus()
          currentUrl.value = url
        }

        break
      }
      case MessageTypeAction.BookmarkStatusRefresh: {
        updateBookmarkStatus()

        break
      }
    }

    return false
  }
)

onMounted(() => {
  updateBookmarkStatus()
  loadBriefDetail().then(() => {
    loadSelection()
  })

  tryGetUserInfo(true).then(res => {
    if (!res) {
      return
    }

    userInfo.value = res
  })
})

onKeyStroke(['z', 'Z'], e => {
  if (needHidden.value) {
    return
  }

  const ctrlFire = (e.ctrlKey && !isMac) || ((e.ctrlKey || e.metaKey) && isMac)
  if (ctrlFire && e.shiftKey) {
    e.preventDefault()

    if (!showPanel.value) {
      panelClick(subPanelItems.value.find(item => item.type === lastOpenItem.value) ?? subPanelItems.value[0])
    } else {
      closePanel()
    }
  }
})

const updateBookmarkStatus = async () => {
  const url = window.location.href
  const bookmarkRecord = await tryGetBookmarkChange(url)
  if (bookmarkRecord) {
    bookmarkId.value = bookmarkRecord
    bookmarkUrl.value = url
    isCollected.value = true
  } else {
    bookmarkUrl.value = ''
    bookmarkId.value = 0
    isCollected.value = false
  }
}

const loadBriefDetail = async () => {
  if (isLoading.value) return

  bookmarkBriefInfo.value = null
  if (needHidden.value) return

  isLoading.value = true
  try {
    const res = await request.get<BookmarkBriefDetail>({
      url: RESTMethodPath.BOOKMARK_BRIEF,
      method: RequestMethodType.get,
      query: {
        bookmark_id: bookmarkId.value
      },
      errorInterceptors: err => {
        if (err instanceof RequestError && err.code === 400) {
          // invalid
        }
      }
    })
    if (!res) throw new Error('loadBriefDetail failed')

    if (bookmarkId.value === res.bookmark_id) {
      bookmarkBriefInfo.value = res
    }
  } finally {
    isLoading.value = false
  }
}

const loadSelection = async () => {
  unloadSelection()

  if (!needHidden.value || !bookmarkBriefInfo.value) {
    const markList = bookmarkBriefInfo.value?.marks
    const user = userInfo.value ?? (await tryGetUserInfo())

    articleSelection = new ArticleSelection({
      allowAction: true,
      containerDom: menus.value!,
      monitorDom: document.body as HTMLDivElement,
      userInfo: user,
      bookmarkIdQuery: async () => {
        if (bookmarkId.value === 0) {
          await addBookmark()
        }

        return bookmarkId.value
      },
      postQuoteDataHandler: (data: QuoteData) => {
        closePanel()
        isChatbotShowing.value = true
        chatbot.value?.addQuoteData(data)
        chatbot.value?.focusTextarea()
      },
      markCommentSelectHandler: (comment: MarkCommentInfo) => {
        closePanel()
        isCommentShowing.value = true
        comments.value?.navigateToComment(comment)
      },
      menusCommentHandler: (info: MarkItemInfo, data: QuoteData['data']) => {
        closePanel()
        isCommentShowing.value = true
        comments.value?.showPostCommentView(info, data)
      }
    })

    if (markList) {
      articleSelection.drawMark(markList)
    }

    articleSelection.startMonitor()
  }
}

const unloadSelection = () => {
  if (articleSelection) {
    articleSelection.closeMonitor()
    articleSelection = null
  }
}

const panelClick = async (panel: PanelItem, finishHandler?: () => void) => {
  const type = panel.type
  if (isLoading.value && type === PanelItemType.Share) {
    return
  }

  const res = await props.browser.runtime.sendMessage({
    action: MessageTypeAction.CheckLogined
  })

  if (!res) {
    return
  }

  if ([PanelItemType.AI, PanelItemType.Chat, PanelItemType.Comments].indexOf(type) > -1) {
    closePanel()
  }

  switch (type) {
    case PanelItemType.AI: {
      isSummaryShowing.value = !isSummaryShowing.value
      break
    }
    case PanelItemType.Chat: {
      isChatbotShowing.value = !isChatbotShowing.value
      break
    }
    case PanelItemType.Comments: {
      isCommentShowing.value = !isCommentShowing.value
      break
    }
    case PanelItemType.Share: {
      if (bookmarkId.value === 0) {
        await addBookmark()
      }

      modalContainer.value &&
        showShareConfigModal({
          bookmarkId: bookmarkId.value,
          title: document.title,
          container: modalContainer.value
        })

      break
    }
    case PanelItemType.Archieve: {
      if (panel.isLoading) {
        panel.finishHandler = undefined
        return
      }

      const archieve = !(bookmarkBriefInfo.value?.archived === 'archive')
      const status = archieve ? 'archive' : 'inbox'
      panel.isLoading = true

      await request.post<{ bookmark_id: number; status: string }>({
        url: RESTMethodPath.BOOKMARK_ARCHIVE,
        body: {
          bookmark_id: bookmarkId.value,
          status
        }
      })

      if (bookmarkBriefInfo.value) {
        bookmarkBriefInfo.value.archived = status
      }

      panel.isLoading = false

      panel.finishHandler && panel.finishHandler()
      panel.finishHandler = undefined

      break
    }

    case PanelItemType.Star: {
      if (panel.isLoading) {
        panel.finishHandler = undefined
        return
      }

      const starred = !(bookmarkBriefInfo.value?.starred === 'star')
      const status = starred ? 'star' : 'unstar'
      panel.isLoading = true

      await request.post<{ bookmark_id: number; status: string }>({
        url: RESTMethodPath.BOOKMARK_STAR,
        body: {
          bookmark_id: bookmarkId.value,
          status
        }
      })

      if (bookmarkBriefInfo.value) {
        bookmarkBriefInfo.value.starred = status
      }

      panel.isLoading = false

      panel.finishHandler && panel.finishHandler()
      panel.finishHandler = undefined
      break
    }

    case PanelItemType.Feedback: {
      modalContainer.value &&
        showFeedbackModal({
          reportType: 'parse_error',
          title: bookmarkBriefInfo.value?.alias_title || bookmarkBriefInfo.value?.title || '',
          params: {
            bookmark_id: bookmarkId.value
          },
          container: modalContainer.value
        })
      break
    }
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection?.findQuote(quote)
}

const closePanel = () => {
  if (isSummaryShowing.value) {
    lastOpenItem.value = PanelItemType.AI
  } else if (isChatbotShowing.value) {
    lastOpenItem.value = PanelItemType.Chat
  } else if (isCommentShowing.value) {
    lastOpenItem.value = PanelItemType.Comments
  } else {
    lastOpenItem.value = undefined
  }

  isSummaryShowing.value = false
  isChatbotShowing.value = false
  isCommentShowing.value = false
}

const getRequestParams = () => {
  const params = getWebSiteInfo()
  return params as AddBookmarkReq
}

const tryGetUserInfo = async (refresh = false) => {
  const res = await queryBackground<UserInfo>({
    action: MessageTypeAction.QueryUserInfo,
    refresh
  })

  if (!res || !res.success) {
    return null
  }

  return res.data
}

const tryGetBookmarkChange = async (url: string) => {
  const res = await queryBackground<{ bookmarkId: number }>({
    action: MessageTypeAction.QueryBookmarkChange,
    url
  })

  console.log('push message res: ', res)

  if (!res || !res.success) {
    return 0
  }

  return res.data.bookmarkId
}

const queryBackground = async <R extends {}>(params: MessageType) => {
  const res = await props.browser.runtime.sendMessage<MessageType, { success: true; data: R } | { success: false; data?: Error }>(params)
  return res
}

const addBookmark = async () => {
  isLoading.value = true

  try {
    const body = getRequestParams()
    const resp = await request.post<AddBookmarkResp>({
      url: RESTMethodPath.ADD_BOOKMARK,
      body
    })

    if (resp) {
      await queryBackground({ action: MessageTypeAction.AddBookmarkChange, url: window.location.href, bookmarkId: resp.bmId })
      bookmarkId.value = resp.bmId
      bookmarkUrl.value = body.target_url
      isCollected.value = true
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.button-wrapper {
  --style: relative w-full h-56px;

  button {
    --style: absolute top-0 right-0 size-full bg-#1F1F1FCC flex items-center flex-nowrap;

    .selected-bg {
      --style: absolute right-5px top-0 bottom-0 left-0 rounded-r-10px bg-#262626;

      &::before,
      &::after {
        --style: content-empty absolute size-10px z-1 bg-#262626;
      }

      &::before {
        --style: bottom-full left-0;
        clip-path: path('M 0 0 A 10 10 0 0 0 10 10 L 0 10 Z');
      }

      &::after {
        --style: top-full left-0;
        clip-path: path('M 0 0 L 10 0 A 10 10 0 0 0 0 10 L 0 0 Z');
      }
    }

    .icon-wrapper {
      --style: relative z-1 size-full rounded-6px shrink-0 overflow-hidden;

      .icon {
        --style: relative size-full;
        img {
          --style: absolute size-24px left-1/2 top-1/2 -translate-1/2 transition-opacity duration-250 object-contain select-none;
        }

        .normal {
          --style: opacity-100;
        }

        .highlighted {
          --style: opacity-0;
        }
      }
    }

    &:hover {
      .icon {
        .normal {
          --style: opacity-0;
        }

        .highlighted {
          --style: opacity-100;
        }
      }
    }
  }
}

.web-panel {
  --style: z-1 fixed cursor-move left-full top-1/2 -translate-x-full -translate-y-1/2;
}
</style>
