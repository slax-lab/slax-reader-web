<template>
  <div class="raw-web-panel">
    <Transition name="sidecontent">
      <div v-if="showPanel" class="sidecontent-wrapper" ref="sidecontent" :style="showPanel && contentWidth ? { width: contentWidth + 'px' } : {}">
        <div class="drag" ref="draggble" />
        <div class="sidebar-container" :style="contentWidth ? { width: contentWidth + 'px' } : {}">
          <div class="sidebar-content"></div>
          <div class="sidebar-panel">
            <div class="panel-buttons">
              <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
                <button @click="panelClick(panel.type)">
                  <div class="icon-wrapper">
                    <div class="icon">
                      <template v-if="panel.type !== selectedType || !panel.selectedIcon">
                        <img class="normal" :src="panel.icon" alt="" />
                        <img class="highlighted" :src="panel.highlighedIcon" alt="" />
                      </template>
                      <template v-else-if="panel.selectedIcon">
                        <img class="selected" :src="panel.selectedIcon" alt="" />
                      </template>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <div class="web-sidebar">
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Position, useDraggable } from '@vueuse/core'

enum PanelItemType {
  'AI' = 'ai',
  'Chat' = 'chat',
  'Share' = 'share'
}

interface PanelItem {
  type: PanelItemType
  icon: string
  highlighedIcon: string
  selectedIcon?: string
  title: string
  hovered: boolean
}

const emits = defineEmits(['panelClick', 'isDragging'])

const minContentWidth = 200
const contentWidth = ref(Math.max(window.innerWidth / 3, minContentWidth))
const sidecontent = useTemplateRef<HTMLDivElement>('sidecontent')
const draggble = useTemplateRef<HTMLDivElement>('draggble')
const selectedType = ref<PanelItemType | ''>('')

const showPanel = ref(false)
const panelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: new URL('@images/panel-item-ai-dark.png', import.meta.url).href,
    highlighedIcon: new URL('@images/panel-item-ai-highlighted-dark.png', import.meta.url).href,
    selectedIcon: new URL('@images/panel-item-ai-selected-dark.png', import.meta.url).href,
    title: 'AI',
    hovered: false
  },
  {
    type: PanelItemType.Chat,
    icon: new URL('@images/panel-item-chatbot-dark.png', import.meta.url).href,
    highlighedIcon: new URL('@images/panel-item-chatbot-highlighted-dark.png', import.meta.url).href,
    selectedIcon: new URL('@images/panel-item-chatbot-selected-dark.png', import.meta.url).href,
    title: 'Chat',
    hovered: false
  },
  {
    type: PanelItemType.Share,
    icon: new URL('@images/panel-item-share-dark.png', import.meta.url).href,
    highlighedIcon: new URL('@images/panel-item-share-highlighted-dark.png', import.meta.url).href,
    title: 'Share',
    hovered: false
  }
])

const { isDragging } = useDraggable(draggble, {
  onMove: (position: Position) => {
    const windowWidth = window.innerWidth
    const left = position.x

    contentWidth.value = Math.min(Math.max(minContentWidth, windowWidth - left), windowWidth - 100)
  }
})

watch(
  () => isDragging.value,
  val => {
    emits('isDragging', val)
  }
)

const panelClick = async (type: PanelItemType) => {
  selectedType.value = type
  showPanel.value = !showPanel.value
  // if (type === 'ai') {
  //   showPanel.value = !showPanel.value
  // } else {
  //   showPanel.value = false
  // }
}
</script>

<style lang="scss" scoped>
.raw-web-panel {
  --style: h-full relatie;
}

.sidecontent-wrapper {
  --style: w-0 h-full bg-#262626 relative z-2;

  .drag {
    --style: absolute top-0 left-0 w-10px h-full z-2 cursor-ew-resize transition-colors duration-250;

    &:hover {
      --style: bg-#ffffff04;
    }
  }

  .sidebar-container {
    --style: relative size-full;

    .sidebar-panel {
      --style: absolute top-0 right-0 h-full w-48px border-l-(1px solid #ffffff0f) flex items-center justify-between;

      .panel-buttons {
        --style: border-t-(1px solid #ffffff0f) border-b-(1px solid #ffffff0f) py-16px w-full;

        .button-wrapper {
          --style: relative w-full h-56px;

          button {
            --style: absolute top-0 right-0 size-full bg-#262626 flex items-center flex-nowrap overflow-hidden;

            .icon-wrapper {
              --style: size-full rounded-6px shrink-0;

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
  }
}

.raw-web-panel {
  .web-sidebar {
    --style: z-1 absolute right-0px top-1/2 -translate-y-1/2 w-52px h-144px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

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

            .selected {
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
}

.sidecontent-leave-to,
.sidecontent-enter-from {
  --style: '!w-0';
}

.sidecontent-enter-active,
.sidecontent-leave-active {
  --style: transition-width duration-250 ease-in-out;
}
</style>
