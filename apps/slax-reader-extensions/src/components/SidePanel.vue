<template>
  <div class="side-panel">
    <div class="panel-container" :class="{ appear: showPanel }">
      <div class="sidebar">
        <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
          <button @click="showPanel = !showPanel">
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
          <button @click="showPanel = !showPanel">
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
      <div class="content"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import aiImage from '~/assets/panel-item-ai.png'
import aiHighlightedImage from '~/assets/panel-item-ai-highlighted.png'
import chatbotImage from '~/assets/panel-item-chatbot.png'
import chatbotHighlightedImage from '~/assets/panel-item-chatbot-highlighted.png'
import shareImage from '~/assets/panel-item-share.png'
import shareHighlightedImage from '~/assets/panel-item-share-highlighted.png'

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

const panelItems = ref<PanelItem[]>([
  { type: PanelItemType.AI, icon: aiImage, highlighedIcon: aiHighlightedImage, title: 'AI', hovered: false },
  { type: PanelItemType.Chat, icon: chatbotImage, highlighedIcon: chatbotHighlightedImage, title: 'Chat', hovered: false },
  { type: PanelItemType.Share, icon: shareImage, highlighedIcon: shareHighlightedImage, title: 'Share', hovered: false }
])

const showPanel = ref(false)

const loadingText = ref('收藏中')
const isLoading = ref(false)
const loadingTitle = ref('收藏中')
const loadingInterval = ref<NodeJS.Timeout>()

const appStatusText = computed(() => {
  return isLoading.value ? loadingTitle.value : isCollected ? '查看收藏' : '收藏内容'
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
  () => showPanel,
  value => {}
)

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

    .sidebar {
      --style: absolute -left-52px top-1/2 -translate-y-1/2 w-52px h-188px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

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

    .content {
      --style: w-200px h-full bg-green;
    }
  }
}
</style>
