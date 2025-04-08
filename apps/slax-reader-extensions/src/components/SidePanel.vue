<template>
  <div class="side-panel" v-on-click-outside="closePanel">
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
          <button>
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
            <AISummaries v-show="isSummaryShowing" :bookmarkId="5131361" :isAppeared="isSummaryShowing" @dismiss="closePanel" />
          </Transition>
          <Transition name="sidepanel">
            <ChatBot v-show="isChatbotShowing" ref="chatbot" :bookmarkId="5131361" :isAppeared="isChatbotShowing" @dismiss="closePanel" @find-quote="findQuote" />
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

import { MouseTrack } from '@commons/utils/mouse'

import type { QuoteData } from './Chat/type'
import { showShareConfigModal } from './Share'
import { ArticleSelection } from '@/components/Selection/selection'
import { vOnClickOutside } from '@vueuse/components'
import { type Position, useDraggable, useScrollLock } from '@vueuse/core'

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
const chatbot = ref<InstanceType<typeof ChatBot>>()

const minContentWidth = 500
const contentWidth = ref(Math.max(window.innerWidth / 3, minContentWidth))

const showPanel = computed(() => {
  return isSummaryShowing.value || isChatbotShowing.value
})

const isSummaryShowing = ref(false)
const isChatbotShowing = ref(false)

const loadingText = ref('收藏中')
const isLoading = ref(false)
const loadingTitle = ref(loadingText.value)
const loadingInterval = ref<NodeJS.Timeout>()
let articleSelection: ArticleSelection | null = null

const appStatusText = computed(() => {
  return isLoading.value ? loadingTitle.value : isCollected ? '查看收藏' : '收藏内容'
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
  if (!isSlaxWebsite(window.location.href)) {
    articleSelection = new ArticleSelection({
      shareCode: 0 || '',
      bookmarkId: 5131361,
      allowAction: true,
      ownerUserId: 0,
      containerDom: menus.value!,
      monitorDom: document.body as HTMLDivElement,
      postQuoteDataHandler: (data: QuoteData) => {
        isChatbotShowing.value = true
        chatbot.value?.addQuoteData(data)
      }
    })

    articleSelection.startMonitor()
  }

  tracking.mouseTrack(true)
})

onUnmounted(() => {
  tracking.destruct()
})

const isSlaxWebsite = (url: string) => {
  try {
    const urlObj = new URL(url)

    if (urlObj.protocol !== 'https:') {
      return false
    }

    const hostname = urlObj.hostname
    const slaxDomainPattern = /^(r|reader|r-beta)\.slax.$/

    return slaxDomainPattern.test(hostname)
  } catch (e) {
    return false
  }
}

const panelClick = (type: PanelItemType) => {
  isSummaryShowing.value = false
  isChatbotShowing.value = false

  switch (type) {
    case PanelItemType.AI:
      isSummaryShowing.value = !isSummaryShowing.value
      break
    case PanelItemType.Chat:
      isChatbotShowing.value = !isChatbotShowing.value
      break
    case PanelItemType.Share:
      // Handle share action
      share.value &&
        showShareConfigModal({
          bookmarkId: 5131361,
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

setTimeout(() => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    isCollected.value = true
  }, 3000)
}, 2000)
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
