<template>
  <div class="side-panel" v-on-click-outside="closePanel" v-if="!needHidden">
    <div class="panel-container" ref="panelContainer" :class="{ appear: showPanel }">
      <div class="panel-sidebar">
        <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
          <button @click="panelClick(panel.type)">
            <div class="icon-wrapper">
              <div class="icon">
                <img class="normal" :src="panel.icon" alt="" />
                <img class="highlighted" :src="panel.highlighedIcon" alt="" />
              </div>
            </div>
            <span>{{ panel.title }}</span>
          </button>
        </div>
        <div class="button-wrapper">
          <button @click="collectionClick">
            <div class="icon-wrapper">
              <div class="icon" :class="{ 'animate-spin': isLoading }">
                <img v-if="!isLoading && !isCollected" src="@/assets/panel-item-app.png" alt="" />
                <img v-else-if="!isLoading && isCollected" src="@/assets/panel-item-collected.png" alt="" />
                <img v-else-if="isLoading" src="@/assets/panel-item-loading.png" alt="" />
              </div>
            </div>
            <span>{{ appStatusText }}</span>
          </button>
        </div>
      </div>
      <div class="panel-content" :style="contentWidth ? { width: contentWidth + 'px' } : {}">
        <div class="drag" ref="draggble" />
        <div class="panel-content-wrapper">
          <Transition name="sidepanel">
            <AISummaries v-show="isSummaryShowing" :key="currentUrl" ref="summaries" :bookmarkId="bookmarkId" :isAppeared="isSummaryShowing" @dismiss="closePanel" />
          </Transition>
          <Transition name="sidepanel">
            <ChatBot
              v-show="isChatbotShowing"
              :key="currentUrl"
              ref="chatbot"
              :bookmarkId="bookmarkId"
              :isAppeared="isChatbotShowing"
              @dismiss="closePanel"
              @find-quote="findQuote"
            />
          </Transition>
        </div>
      </div>
    </div>
  </div>
  <div class="menus" ref="menus"></div>
  <div class="share" ref="share"></div>
</template>

<script lang="ts" setup>
import AISummaries from './AISummaries.vue'
import ChatBot from './Chat/ChatBot.vue'

import aiImage from '~/assets/panel-item-ai.png'
import aiHighlightedImage from '~/assets/panel-item-ai-highlighted.png'
import chatbotImage from '~/assets/panel-item-chatbot.png'
import chatbotHighlightedImage from '~/assets/panel-item-chatbot-highlighted.png'
import shareImage from '~/assets/panel-item-share.png'
import shareHighlightedImage from '~/assets/panel-item-share-highlighted.png'

import { type MessageType, MessageTypeAction } from '@/config'

import { MouseTrack } from '@commons/utils/mouse'

import type { QuoteData } from './Chat/type'
import { ArticleSelection } from './Selection/selection'
import { showShareConfigModal } from './Share'
import { RESTMethodPath } from '@commons/types/const'
import type { AddBookmarkReq, AddBookmarkResp, MarkDetail, UserInfo } from '@commons/types/interface'
import { vOnClickOutside } from '@vueuse/components'
import { type Position, useDraggable, useScrollLock } from '@vueuse/core'
import type { WxtBrowser } from 'wxt/browser'

enum PanelItemType {
  'AI' = 'ai',
  'Chat' = 'chat',
  'Share' = 'share'
}

interface PanelItem {
  type: PanelItemType
  icon: string
  highlighedIcon: string
  title: string
  hovered: boolean
}

const props = defineProps({
  browser: {
    type: Object as PropType<WxtBrowser>,
    required: true
  }
})

const isCollected = ref(false)
const isLocked = useScrollLock(window)

const panelItems = ref<PanelItem[]>([
  { type: PanelItemType.AI, icon: aiImage, highlighedIcon: aiHighlightedImage, title: 'AI', hovered: false },
  { type: PanelItemType.Chat, icon: chatbotImage, highlighedIcon: chatbotHighlightedImage, title: 'Chat', hovered: false },
  { type: PanelItemType.Share, icon: shareImage, highlighedIcon: shareHighlightedImage, title: 'Share', hovered: false }
])

const panelContainer = ref<HTMLDivElement>()
const menus = ref<HTMLDivElement>()
const share = useTemplateRef<HTMLDivElement>('share')
const draggble = useTemplateRef<HTMLDivElement>('draggble')
const summaries = ref<InstanceType<typeof AISummaries>>()
const chatbot = ref<InstanceType<typeof ChatBot>>()

const minContentWidth = 500
const contentWidth = ref(Math.max(window.innerWidth / 3, minContentWidth))

const bookmarkId = ref(0)
const bookmarkUrl = ref('')
const currentUrl = ref(window.location.href)

const isSummaryShowing = ref(false)
const isChatbotShowing = ref(false)

const loadingText = ref('收藏中')
const isLoading = ref(false)
const loadingTitle = ref(loadingText.value)
const loadingInterval = ref<NodeJS.Timeout>()

let articleSelection: ArticleSelection | null = null

const needExamine = ref(false)

const showPanel = computed(() => {
  return isSummaryShowing.value || isChatbotShowing.value
})

const appStatusText = computed(() => {
  return isLoading.value ? loadingTitle.value : isCollected ? '查看收藏' : '收藏内容'
})

const needHidden = computed(() => {
  return isSlaxWebsite(currentUrl.value) || bookmarkId.value === 0
})

useDraggable(draggble, {
  onMove: (position: Position) => {
    const windowWidth = window.innerWidth
    const left = position.x

    contentWidth.value = Math.min(Math.max(minContentWidth, windowWidth - left), windowWidth - 100)
  }
})

watch(
  () => isLoading.value,
  (value, oldValue) => {
    if (value === oldValue) {
      return
    }

    if (value) {
      loadingTitle.value = loadingText.value
      loadingInterval.value = setInterval(() => {
        const ellipses = loadingTitle.value.replace(loadingText.value, '')
        loadingTitle.value = `${loadingText.value}${Array.from({ length: (ellipses.length + 1) % 4 })
          .map(() => '.')
          .join('')}`
      }, 800)
    } else {
      clearInterval(loadingInterval.value)
    }
  }
)

watch(
  () => showPanel.value,
  value => {
    if (value) {
      tracking.touchTrack(showPanel.value)
      tracking.wheelTrack(showPanel.value)
    }
  }
)

watch(
  () => bookmarkId.value,
  value => {
    if (!value) {
      unloadSelection()
      return
    }

    loadSelection()
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

const trackingHandler = () => {
  checkInAnotherScrollableView()
}

const tracking = new MouseTrack({
  touchTrackingHandler: trackingHandler,
  wheelTrackingHandler: trackingHandler
})

const checkInAnotherScrollableView = () => {
  let needLock = false
  if (panelContainer.value && isMouseWithinElement(panelContainer.value)) {
    needLock = true
  }

  if (needLock) {
    !isLocked.value && (isLocked.value = true)
  } else {
    isLocked.value && (isLocked.value = false)
  }
}

const isMouseWithinElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const { x, y } = tracking.lastMousePosition
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

onMounted(() => {
  tracking.mouseTrack(true)

  updateBookmarkStatus()
  loadSelection()
})

onUnmounted(() => {
  tracking.destruct()
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

const loadSelection = async () => {
  unloadSelection()

  if (!needHidden.value) {
    const markList = bookmarkId.value ? await getBookmarkMarkList(bookmarkId.value) : null
    const userInfo = await tryGetUserInfo()

    articleSelection = new ArticleSelection({
      allowAction: true,
      containerDom: menus.value!,
      monitorDom: document.body as HTMLDivElement,
      userInfo: userInfo,
      bookmarkIdQuery: async () => {
        if (bookmarkId.value === 0) {
          await addBookmark()
        }

        return bookmarkId.value
      },
      postQuoteDataHandler: (data: QuoteData) => {
        isChatbotShowing.value = true
        chatbot.value?.addQuoteData(data)
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

const collectionClick = async () => {
  if (isLoading.value) {
    return
  }

  if (!isCollected.value || !bookmarkId.value) {
    await addBookmark()
  } else if (isCollected.value && bookmarkId.value) {
    checkSource()
  }
}

const panelClick = async (type: PanelItemType) => {
  if (isLoading.value && type === PanelItemType.Share) {
    return
  }

  const res = await props.browser.runtime.sendMessage({
    action: MessageTypeAction.CheckLogined
  })

  if (!res) {
    return
  }

  const userInfo = await tryGetUserInfo(needExamine.value)

  isSummaryShowing.value = false
  isChatbotShowing.value = false

  needExamine.value = !(await examineSideBarAction(type, userInfo))
  if (needExamine.value) {
    return
  }

  switch (type) {
    case PanelItemType.AI:
      isSummaryShowing.value = !isSummaryShowing.value
      break
    case PanelItemType.Chat:
      isChatbotShowing.value = !isChatbotShowing.value
      break
    case PanelItemType.Share:
      if (bookmarkId.value === 0) {
        await addBookmark()
      }

      share.value &&
        showShareConfigModal({
          bookmarkId: bookmarkId.value,
          title: document.title,
          container: share.value
        })

      break
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection?.findQuote(quote)
}

const closePanel = () => {
  isSummaryShowing.value = false
  isChatbotShowing.value = false
}

const getWebSiteInfo = () => {
  var r: any = {}
  r.target_url = window.location.href
  r.target_title = document.title || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || `${location.href}${location.pathname}`

  const iconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')
  r.target_icon = iconLink ? iconLink.getAttribute('href') : ''
  r.description =
    document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    ''

  const cloneDom = document.cloneNode(true) as Document
  Array.from(cloneDom.getElementsByTagName('slax-reader-modal') || []).forEach(element => element.remove())
  r.content = (cloneDom || document).documentElement.outerHTML

  return r as AddBookmarkReq
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

const getBookmarkMarkList = async (bookmarkId: number) => {
  const res = await request.get<MarkDetail>({
    url: RESTMethodPath.BOOKMARK_MARK_LIST,
    query: {
      bookmark_id: String(bookmarkId)
    }
  })

  return res
}

const queryBackground = async <R extends {}>(params: MessageType) => {
  const res = await props.browser.runtime.sendMessage<MessageType, { success: true; data: R } | { success: false; data?: Error }>(params)
  return res
}

const addBookmark = async () => {
  isLoading.value = true

  try {
    const websiteInfo = getWebSiteInfo()
    const resp = await request.post<AddBookmarkResp>({
      url: RESTMethodPath.ADD_BOOKMARK,
      body: {
        ...websiteInfo
      }
    })

    if (resp) {
      await queryBackground({ action: MessageTypeAction.AddBookmarkChange, url: window.location.href, bookmarkId: resp.bmId })
      bookmarkId.value = resp.bmId
      bookmarkUrl.value = websiteInfo.target_url
      isCollected.value = true
    }
  } finally {
    isLoading.value = false
  }
}

const checkSource = () => {
  window.open(`${process.env.PUBLIC_BASE_URL}/bookmarks/${bookmarkId.value}`, '_blank')
}
</script>

<style lang="scss" scoped>
.side-panel {
  --style: fixed left-full top-0 h-screen;

  .panel-container {
    --style: relative h-full transition-transform duration-250 ease-in-out;

    &.appear {
      --style: -translate-x-full;
    }

    .panel-sidebar {
      --style: z-1 absolute -left-52px top-1/2 -translate-y-1/2 w-52px h-188px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

      &::before {
        --style: content-empty absolute left-full top-0 w-10px h-full bg-#262626;
      }

      .button-wrapper {
        --style: relative size-44px;

        button {
          --style: absolute top-0 right-0 max-w-44px h-44px p-4px pr-8px bg-#262626 rounded-(lt-8px lb-8px) flex items-center flex-nowrap overflow-hidden whitespace-nowrap
            transition-max-width duration-250;

          .icon-wrapper {
            --style: border-(1px solid #ffffff14) rounded-6px shrink-0;

            .icon {
              --style: relative size-36px;
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
            --style: '!max-w-108px';

            .icon {
              .normal {
                --style: opacity-0;
              }

              .highlighted {
                --style: opacity-100;
              }
            }
          }

          span {
            --style: ml-8px text-(13px #ffffff99) line-height-18px shrink-0;
          }
        }
      }
    }

    .panel-content {
      --style: z-2 relative w-500px h-100vh bg-#262626FF;

      .drag {
        --style: absolute top-0 left-0 w-10px h-full z-2 cursor-ew-resize transition-colors duration-250;

        &:hover {
          --style: bg-#ffffff04;
        }
      }

      .panel-content-wrapper {
        --style: w-full h-full overflow-auto;
      }
    }
  }
}

.sidepanel-enter-active,
.sidepanel-leave-active {
  transition: all 0.4s;
}

.sidepanel-enter-from,
.sidepanel-leave-to {
  --style: '!opacity-0';
}
</style>
