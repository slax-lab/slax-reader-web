<template>
  <div class="side-panel" v-if="!needHidden">
    <div class="web-panel">
      <SidebarTips>
        <div class="panel-container">
          <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
            <button @click="panelClick(panel)">
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
              <span>{{ panel.title }}</span>
            </button>
          </div>
        </div>
      </SidebarTips>
    </div>
    <div class="main-panel" ref="panelContainer" :class="{ appear: showPanel }">
      <div class="drag" ref="draggble" />
      <div class="sidebar-container" :style="contentWidth ? { width: contentWidth + 'px' } : {}">
        <div class="sidebar-wrapper" :class="{ dragging: isDragging }">
          <div class="sidebar-header" @click="go">
            <img src="@/assets/tiny-app-logo-gray.png" alt="" />
            <span>Slax Reader</span>
          </div>
          <div class="sidebar-content">
            <Transition name="sidepanel">
              <div class="dark px-20px pt-4px" v-show="isSummaryShowing">
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
          </div>
        </div>
        <div class="sidebar-panel">
          <div class="operate-button top">
            <button class="close" @click="closePanel">
              <img src="@/assets/button-dialog-close.png" />
            </button>
          </div>
          <div class="panel-buttons">
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
          </div>
          <div class="operate-button bottom">
            <DotsMenu :actions="menuActions" @action="menuClick" />
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-panel">
      <div class="panel-container" :class="{ 'hide-corner': isBottomPanelHideCorner }">
        <img class="logo" @click="checkSource" src="@/assets/tiny-app-logo-gray.png" />
        <template v-for="panel in isBottomPanelShrink ? [bottomPanelItem[0]] : bottomPanelItem" :key="panel.type">
          <i class="seperator"></i>
          <div class="button-wrapper">
            <button @click="panelClick(panel)">
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
              <span class="title" :style="panel.isSelected && panel.isSelected() && panel.selectedColor ? { color: panel.selectedColor } : {}">{{ panel.title }}</span>
            </button>
            <Transition name="opacity">
              <div class="absolute inset-0 z-2 bg-#262626 flex-center" v-show="panel.isLoading" @click.stop>
                <div class="i-svg-spinners:180-ring-with-bg text-16px text-#999"></div>
              </div>
            </Transition>
          </div>
        </template>
        <template v-if="isBottomPanelShrink">
          <i class="seperator"></i>
          <div class="button-wrapper">
            <button @click="bottomShrinkClick">
              <div class="icon-wrapper">
                <div class="icon">
                  <img class="normal" src="@/assets/tiny-menu-dots.png" alt="" />
                  <img class="highlighted" src="@/assets/tiny-menu-dots.png" alt="" />
                </div>
              </div>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div class="slax-menus" ref="menus"></div>
  <div class="slax-custom-container" ref="modalContainer"></div>
</template>

<script lang="ts" setup>
import AISummaries from './AISummaries.vue'
import ChatBot from './Chat/ChatBot.vue'
import DotsMenu, { type DotsMenuActionItem } from './DotsMenu.vue'
import SidebarTips from './Tips/SidebarTips.vue'

// image asssets
import aiImage from '~/assets/panel-item-ai.png'
import aiHighlightedImage from '~/assets/panel-item-ai-highlighted.png'
import aiSelectedImage from '~/assets/panel-item-ai-selected.png'
import aiSubImage from '~/assets/panel-item-ai-sub.png'
import archieveBottomImage from '~/assets/panel-item-archieve-bottom.png'
import archieveBottomSelectedImage from '~/assets/panel-item-archieve-bottom-selected.png'
import chatbotImage from '~/assets/panel-item-chatbot.png'
import chatbotHighlightedImage from '~/assets/panel-item-chatbot-highlighted.png'
import chatbotSelectedImage from '~/assets/panel-item-chatbot-selected.png'
import chatbotSubImage from '~/assets/panel-item-chatbot-sub.png'
import commentsImage from '~/assets/panel-item-comments.png'
import commentsHighlightedImage from '~/assets/panel-item-comments-highlighted.png'
import commentsSelectedImage from '~/assets/panel-item-comments-selected.png'
import commentsSubImage from '~/assets/panel-item-comments-sub.png'
import shareBottomImage from '~/assets/panel-item-share-bottom.png'
import starBottomImage from '~/assets/panel-item-star-bottom.png'
import starBottomSelectedImage from '~/assets/panel-item-star-bottom-selected.png'

import { type MessageType, MessageTypeAction } from '@/config'

import { MouseTrack } from '@commons/utils/mouse'
import { RequestError, RequestMethodType } from '@commons/utils/request'

import type { QuoteData } from './Chat/type'
import { showAboutModal, showFeedbackModal, showShareConfigModal } from './Modal'
import { ArticleSelection } from './Selection/selection'
import { RESTMethodPath } from '@commons/types/const'
import type { AddBookmarkReq, AddBookmarkResp, BookmarkBriefDetail, MarkDetail, UserInfo } from '@commons/types/interface'
import { type Position, useDraggable, useScrollLock } from '@vueuse/core'
import type { WxtBrowser } from 'wxt/browser'

enum PanelItemType {
  'AI' = 'ai',
  'Chat' = 'chat',
  'Share' = 'share',
  'Comments' = 'comments',
  'Archieve' = 'archieve',
  'Star' = 'star'
}

interface PanelItem {
  type: PanelItemType
  icon: string
  highlighedIcon: string
  selectedIcon?: string
  title: string
  hovered: boolean
  selectedColor?: string
  isSelected?: () => boolean
  isLoading?: boolean
}

const props = defineProps({
  browser: {
    type: Object as PropType<WxtBrowser>,
    required: true
  }
})

const isCollected = ref(false)
const isLocked = useScrollLock(window)

const isBottomPanelHideCorner = ref(false)
const isBottomPanelShrink = ref(true)

const panelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: aiImage,
    highlighedIcon: aiHighlightedImage,
    selectedIcon: aiSelectedImage,
    title: $t('component.sidebar.ai'),
    hovered: false,
    isSelected: () => isSummaryShowing.value
  },
  {
    type: PanelItemType.Chat,
    icon: chatbotImage,
    highlighedIcon: chatbotHighlightedImage,
    selectedIcon: chatbotSelectedImage,
    title: $t('component.sidebar.chat'),
    hovered: false,
    isSelected: () => isChatbotShowing.value
  },
  {
    type: PanelItemType.Comments,
    icon: commentsImage,
    highlighedIcon: commentsHighlightedImage,
    selectedIcon: commentsSelectedImage,
    title: $t('component.sidebar.comments'),
    hovered: false,
    isSelected: () => false
  }
])

const subPanelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: aiSubImage,
    highlighedIcon: aiHighlightedImage,
    selectedIcon: aiSelectedImage,
    title: $t('component.sidebar.ai'),
    hovered: false,
    isSelected: () => isSummaryShowing.value
  },
  {
    type: PanelItemType.Chat,
    icon: chatbotSubImage,
    highlighedIcon: chatbotHighlightedImage,
    selectedIcon: chatbotSelectedImage,
    title: $t('component.sidebar.chat'),
    hovered: false,
    isSelected: () => isChatbotShowing.value
  },
  {
    type: PanelItemType.Comments,
    icon: commentsSubImage,
    highlighedIcon: commentsHighlightedImage,
    selectedIcon: commentsSelectedImage,
    title: $t('component.sidebar.comments'),
    hovered: false,
    isSelected: () => false
  }
])

const bottomPanelItem = ref<PanelItem[]>([
  {
    type: PanelItemType.Archieve,
    icon: archieveBottomImage,
    highlighedIcon: archieveBottomImage,
    selectedIcon: archieveBottomSelectedImage,
    title: $t('component.sidebar.archieve'),
    hovered: false,
    selectedColor: '#16b998',
    isSelected: () => bookmarkBriefInfo.value?.archived === 'archive'
  },
  {
    type: PanelItemType.Star,
    icon: starBottomImage,
    highlighedIcon: starBottomImage,
    selectedIcon: starBottomSelectedImage,
    title: $t('component.sidebar.star'),
    hovered: false,
    selectedColor: '#F6AF69',
    isSelected: () => bookmarkBriefInfo.value?.starred === 'star'
  },
  {
    type: PanelItemType.Share,
    icon: shareBottomImage,
    highlighedIcon: shareBottomImage,
    title: $t('component.sidebar.share'),
    hovered: false
  }
])

const panelContainer = ref<HTMLDivElement>()
const menus = ref<HTMLDivElement>()
const modalContainer = useTemplateRef<HTMLDivElement>('modalContainer')
const draggble = useTemplateRef<HTMLDivElement>('draggble')
const summaries = ref<InstanceType<typeof AISummaries>>()
const chatbot = ref<InstanceType<typeof ChatBot>>()

const minContentWidth = 560
const contentWidth = ref(Math.min(window.innerWidth, minContentWidth))

const bookmarkId = ref(0)
const bookmarkUrl = ref('')
const currentUrl = ref(window.location.href)
const bookmarkBriefInfo = ref<BookmarkBriefDetail | null>(null)

const isSummaryShowing = ref(false)
const isChatbotShowing = ref(false)

const loadingText = ref($t('component.sidebar.collecting'))
const isLoading = ref(false)
const loadingTitle = ref(loadingText.value)
const loadingInterval = ref<NodeJS.Timeout>()

const menuActions = ref<DotsMenuActionItem[]>([
  { id: 'about', name: $t('component.sidebar.about') },
  { id: 'feedback', name: $t('component.sidebar.feedback') }
])

let articleSelection: ArticleSelection | null = null

const needExamine = ref(false)

const showPanel = computed(() => {
  return isSummaryShowing.value || isChatbotShowing.value
})

const needHidden = computed(() => {
  return isSlaxWebsite(currentUrl.value) || bookmarkId.value === 0
})

const { isDragging } = useDraggable(draggble, {
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
  loadBriefDetail().then(() => {
    loadSelection()
  })
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

const panelClick = async (panel: PanelItem) => {
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

  const userInfo = await tryGetUserInfo(needExamine.value)

  isSummaryShowing.value = false
  isChatbotShowing.value = false

  needExamine.value = !(await examineSideBarAction(type, userInfo))
  if (needExamine.value) {
    return
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

      if (archieve) {
        isBottomPanelShrink.value = false
      }

      panel.isLoading = false

      break
    }

    case PanelItemType.Star: {
      if (panel.isLoading) {
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

      break
    }
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection?.findQuote(quote)
}

const closePanel = () => {
  isSummaryShowing.value = false
  isChatbotShowing.value = false
}

const bottomShrinkClick = () => {
  isBottomPanelShrink.value = false
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

const menuClick = async (action: DotsMenuActionItem) => {
  const { id } = action
  if (id === 'about') {
    modalContainer.value &&
      showAboutModal({
        container: modalContainer.value
      })
  } else if (id === 'feedback') {
    modalContainer.value &&
      showFeedbackModal({
        reportType: 'parse_error',
        title: bookmarkBriefInfo.value?.alias_title || bookmarkBriefInfo.value?.title || '',
        params: {
          bookmark_id: bookmarkId.value
        },
        container: modalContainer.value
      })
  }
}

const go = () => {
  window.open(`${process.env.PUBLIC_BASE_URL}/bookmarks`, '_blank')
}
</script>

<style lang="scss" scoped>
.side-panel {
  --style: fixed left-full top-0 h-screen;

  .web-panel {
    --style: z-1 fixed right-0 top-1/2 -translate-y-1/2;

    .panel-container {
      --style: w-52px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

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
            --style: '!max-w-160px';

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
  }

  .main-panel {
    --style: z-2 relative h-full bg-#262626 transition-transform duration-250 ease-in-out;

    &.appear {
      --style: -translate-x-full;
    }

    .drag {
      --style: absolute top-0 left-0 w-10px h-full z-2 cursor-ew-resize transition-colors duration-250;

      &:hover {
        --style: bg-#ffffff04;
      }
    }

    .sidebar-container {
      --style: relative size-full;

      .sidebar-panel {
        --style: bg-#1F1F1FCC absolute top-0 right-0 h-full w-48px flex items-center justify-between;

        .operate-button {
          --style: absolute left-1/2 -translate-x-1/2 flex items-center justify-center;

          &.top {
            --style: top-16px;
          }

          &.bottom {
            --style: bottom-24px;
          }

          button {
            --style: 'hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
          }

          .close {
            --style: size-16px flex-center;
            img {
              --style: w-full select-none;
            }
          }
        }

        .panel-buttons {
          --style: py-16px w-full;

          .button-wrapper {
            --style: relative w-full h-56px;

            button {
              --style: absolute top-0 right-0 size-full bg-#1F1F1FCC flex items-center flex-nowrap;

              .selected-bg {
                --style: absolute right-5px top-0 bottom-0 left-0 rounded-r-7px bg-#262626;

                &::before,
                &::after {
                  --style: content-empty absolute w-7px h-7px z-1 bg-#262626;
                }

                &::before {
                  --style: bottom-full left-0;
                  clip-path: path('M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z');
                }

                &::after {
                  --style: top-full left-0;
                  clip-path: path('M 0 0 L 7 0 A 7 7 0 0 0 0 7 L 0 0 Z');
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
        }
      }

      .sidebar-wrapper {
        --style: h-full pr-48px flex flex-col bg-#262626FF;

        &.dragging {
          --style: select-none;
        }

        .sidebar-header {
          --style: w-fit h-48px pl-20px bg-#1F1F1FCC flex items-center justify-start cursor-pointer;

          img {
            --style: size-16px object-contain;
          }

          span {
            --style: ml-2px text-(14px #ffffff66) font-semibold line-height-20px;
          }
        }

        .sidebar-content {
          --style: size-full overflow-auto;

          scrollbar-width: none;
          &::-webkit-scrollbar {
            --style: hidden;
          }
        }
      }
    }
  }

  .bottom-panel {
    --style: z-1 fixed bottom-48px left-1/2 -translate-x-1/2;

    .panel-container {
      --style: relative h-40px rounded-20px px-16px py-5px flex items-center bg-#262626 overflow-hidden shadow-[0px_20px_60px_0px_#00000033] transition-all duration-250;

      .logo {
        --style: size-16px object-contain;
      }

      .seperator {
        --style: mx-10px w-1px h-12px shrink-0 bg-#99999929;
      }

      .button-wrapper {
        --style: relative h-full;

        button {
          --style: px-6px h-full flex items-center flex-nowrap transition-all duration-250 rounded-5px;
          --style: 'hover:(bg-#99999929)';

          .icon-wrapper {
            --style: relative z-1 size-16px shrink-0 overflow-hidden;

            .icon {
              --style: relative size-full;
              img {
                --style: absolute size-full left-1/2 top-1/2 -translate-1/2 transition-opacity duration-250 object-contain select-none;
              }

              .normal {
                --style: opacity-100;
              }

              .highlighted {
                --style: opacity-0;
              }
            }
          }

          .title {
            --style: ml-4px text-(#999999 13px) line-height-18px;
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
