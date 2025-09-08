<template>
  <div class="sidebar-items">
    <div class="button-wrapper" v-for="panel in panelItems" :key="panel.type">
      <button class="panel-button" @click="panelClick(panel)">
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
    <div class="button-wrapper">
      <button class="panel-button" @click="dotsClick">
        <div class="icon-wrapper">
          <div class="icon">
            <i :class="{ star: isStar }"></i>
            <i :class="{ archive: isArchive }"></i>
            <i></i>
          </div>
        </div>
        <span>{{ $t('component.sidebar.more') }}</span>
      </button>
      <Transition name="more">
        <div class="more-options-wrapper" v-show="moreShow" v-on-click-outside="outsideClick">
          <div class="more-options">
            <button class="subpanel-button" v-for="panel in morePanelItem" :key="panel.type" @click="panelClick(panel)">
              <div class="icon">
                <template v-if="panel.isLoading">
                  <div class="i-svg-spinners:90-ring w-16px color-#FFFFFF99"></div>
                </template>
                <template v-else>
                  <template v-if="!(panel.isSelected && panel.isSelected()) || !panel.selectedIcon">
                    <img class="normal" :src="panel.icon" alt="" />
                    <img class="highlighted" :src="panel.highlighedIcon" alt="" />
                  </template>
                  <template v-else>
                    <img class="selected" :src="panel.selectedIcon" alt="" />
                  </template>
                </template>
              </div>
              <span>{{ panel.title }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Images, type PanelItem, PanelItemType } from '@/config/panel'

import { vOnClickOutside } from '@vueuse/components'

const props = defineProps({
  isSummaryShowing: {
    type: Boolean,
    required: false
  },
  isChatbotShowing: {
    type: Boolean,
    required: false
  },
  isCommentShowing: {
    type: Boolean,
    required: false
  },
  isStar: {
    type: Boolean,
    required: false
  },
  isArchive: {
    type: Boolean,
    required: false
  }
})

const emits = defineEmits(['panel-item-action'])

const panelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: Images.ai.main,
    highlighedIcon: Images.ai.highlighted,
    selectedIcon: Images.ai.selected,
    title: $t('component.sidebar.ai'),
    hovered: false,
    isSelected: () => props.isSummaryShowing
  },
  {
    type: PanelItemType.Chat,
    icon: Images.chatbot.main,
    highlighedIcon: Images.chatbot.highlighted,
    selectedIcon: Images.chatbot.selected,
    title: $t('component.sidebar.chat'),
    hovered: false,
    isSelected: () => props.isChatbotShowing
  },
  {
    type: PanelItemType.Comments,
    icon: Images.comments.main,
    highlighedIcon: Images.comments.highlighted,
    selectedIcon: Images.comments.selected,
    title: $t('component.sidebar.comments'),
    hovered: false,
    isSelected: () => props.isCommentShowing
  }
])

const morePanelItem = ref<PanelItem[]>([
  {
    type: PanelItemType.Star,
    icon: Images.star.main,
    highlighedIcon: Images.star.highlighted,
    selectedIcon: Images.star.selected,
    title: $t('component.sidebar.star'),
    hovered: false,
    isSelected: () => props.isStar
  },
  {
    type: PanelItemType.Archieve,
    icon: Images.archieve.main,
    highlighedIcon: Images.archieve.highlighted,
    selectedIcon: Images.archieve.selected,
    title: $t('component.sidebar.archieve'),
    hovered: false,
    isSelected: () => props.isArchive
  },
  {
    type: PanelItemType.Share,
    icon: Images.share.main,
    highlighedIcon: Images.share.highlighted,
    title: $t('component.sidebar.share'),
    hovered: false
  }
])

const moreShow = ref(false)

const outsideClick = () => {
  moreShow.value = false
  clearHandler()
}

const dotsClick = (e: Event) => {
  e.stopPropagation()

  moreShow.value = !moreShow.value
  !moreShow.value && clearHandler()
}

const clearHandler = () => {
  morePanelItem.value.forEach(panel => {
    panel.finishHandler = undefined
  })
}

const panelClick = async (panel: PanelItem) => {
  if ([PanelItemType.Star, PanelItemType.Archieve].includes(panel.type)) {
    panel.finishHandler = () => {
      moreShow.value = false
    }
  }

  emits('panel-item-action', panel)
}
</script>

<style lang="scss" scoped>
.sidebar-items {
  --style: relative z-2 w-52px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

  .button-wrapper {
    --style: relative size-44px;

    button.panel-button {
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

          i {
            --style: absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 size-3.5px bg-#fcfcfc opacity-60 transition-all duration-250;

            &:nth-child(1) {
              --style: top-1/3;
            }

            &:nth-child(2) {
              --style: top-1/2;
            }

            &:nth-child(3) {
              --style: top-2/3;
            }

            &.star {
              --style: bg-#ffc787;
            }

            &.archive {
              --style: bg-#16b998;
            }
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

          i {
            --style: opacity-100;
          }
        }
      }

      span {
        --style: ml-8px text-(13px #ffffff99) line-height-18px shrink-0;
      }
    }

    .more-options-wrapper {
      --style: cursor-default absolute top-0 -right-4px w-150px h-110px rounded-8px bg-#262626;
      .more-options {
        --style: flex flex-col py-7px px-8px opacity-100;

        button.subpanel-button {
          --style: flex items-center h-32px px-16px overflow-hidden whitespace-nowrap text-ellipsis rounded-6px transition-all duration-250;
          --style: 'text-#ffffff99 hover:(bg-#00000029 text-#ffffffe6)';

          .icon {
            --style: relative size-16px;
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
            --style: ml-8px text-13px line-height-18px transition-all duration-250;
          }
        }
      }
    }
  }
}

.more-leave-active {
  transition:
    all 0.4s,
    opacity 0.2s ease 0.2s;

  .more-options {
    transition: all 0.4s;
  }
}

.more-enter-active {
  transition: all 0.4s;
}

.more-enter-from,
.more-leave-to {
  --style: '!w-full !h-full !right-0 !opacity-0';

  .more-options {
    --style: '!opacity-0';
  }
}
</style>
