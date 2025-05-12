<template>
  <div class="raw-web-panel">
    <Transition name="sidecontent">
      <div v-if="showPanel" class="sidecontent-wrapper" ref="sidecontent" :style="showPanel && contentWidth ? { width: contentWidth + 'px' } : {}">
        <div class="drag" ref="draggble" />
        <div class="sidebar-container" :style="contentWidth ? { width: contentWidth + 'px' } : {}">
          <div class="sidebar-wrapper">
            <div class="sidebar-content">
              <slot name="sidebar"></slot>
            </div>
          </div>
          <div class="sidebar-panel">
            <div class="operate-button top">
              <button class="close" @click="showPanel = false">
                <img src="@images/button-dialog-close-dark.png" />
              </button>
            </div>
            <div class="panel-buttons">
              <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
                <button @click="panelClick(panel.type)">
                  <div class="icon-wrapper">
                    <div class="icon">
                      <template v-if="panel.type !== panelType || !panel.selectedIcon">
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
            <div class="operate-button bottom">
              <button class="feedback" @click="feedbackClick">
                <img src="@images/button-feedback-icon-dark.png" />
              </button>
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
import { PanelItemType } from '#layers/core/composables/bookmark/useWebBookmark'

interface PanelItem {
  type: PanelItemType
  icon: string
  highlighedIcon: string
  selectedIcon?: string
  title: string
  hovered: boolean
}

const props = defineProps({
  panelType: {
    type: String,
    default: null,
    required: true
  },
  enableShare: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['isDragging', 'selectedType'])

const minContentWidth = 500
const contentWidth = ref(Math.max(window.innerWidth / 3, minContentWidth))
const sidecontent = useTemplateRef<HTMLDivElement>('sidecontent')
const draggble = useTemplateRef<HTMLDivElement>('draggble')

const showPanel = defineModel('show')
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
  }
])

if (props.enableShare) {
  panelItems.value.push({
    type: PanelItemType.Share,
    icon: new URL('@images/panel-item-share-dark.png', import.meta.url).href,
    highlighedIcon: new URL('@images/panel-item-share-highlighted-dark.png', import.meta.url).href,
    title: 'Share',
    hovered: false
  })
}

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
  emits('selectedType', type)
}

const feedbackClick = () => {
  panelClick(PanelItemType.Feedback)
}
</script>

<style lang="scss" scoped>
.raw-web-panel {
  --style: h-full relative;
}

.sidecontent-wrapper {
  --style: w-0 h-full bg-#262626 z-2;
  --style: 'max-md:(absolute right-0) md:(relative)';

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

      .operate-button {
        --style: absolute left-1/2 -translate-x-1/2 flex items-center justify-center overflow-hidden;

        &.top {
          --style: top-27px;
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

        .feedback {
          --style: w-18px h-auto flex-center;
          img {
            --style: w-full select-none;
          }
        }
      }

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

    .sidebar-wrapper {
      --style: h-full pr-48px flex flex-col;

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

.raw-web-panel {
  .web-sidebar {
    --style: z-1 absolute right-0px top-1/2 -translate-y-1/2 w-52px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

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
