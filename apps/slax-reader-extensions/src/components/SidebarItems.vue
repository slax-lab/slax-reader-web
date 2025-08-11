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
      <button class="panel-button" @click="moreShow = !moreShow">
        <div class="icon-wrapper">
          <div class="icon">
            <img class="normal" :src="moreImage" alt="" />
            <img class="highlighted" :src="moreHighlightedImage" alt="" />
          </div>
        </div>
        <span>{{ $t('component.sidebar.more') }}</span>
      </button>
      <Transition name="more">
        <div class="more-options-wrapper" v-show="moreShow" v-on-click-outside="outsideClick">
          <div class="more-options" @click="moreShow = false">
            <button class="subpanel-button" v-for="panel in morePanelItem" :key="panel.type" @click="panelClick(panel)">
              <div class="icon">
                <template v-if="!(panel.isSelected && panel.isSelected()) || !panel.selectedIcon">
                  <img class="normal" :src="panel.icon" alt="" />
                  <img class="highlighted" :src="panel.highlighedIcon" alt="" />
                </template>
                <template v-else>
                  <img class="selected" :src="panel.selectedIcon" alt="" />
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
import aiImage from '~/assets/panel-item-ai.png'
import aiHighlightedImage from '~/assets/panel-item-ai-highlighted.png'
import aiSelectedImage from '~/assets/panel-item-ai-selected.png'
import archieveImage from '~/assets/panel-item-archieve.png'
import archieveSelectedImage from '~/assets/panel-item-archieve-selected.png'
import chatbotImage from '~/assets/panel-item-chatbot.png'
import chatbotHighlightedImage from '~/assets/panel-item-chatbot-highlighted.png'
import chatbotSelectedImage from '~/assets/panel-item-chatbot-selected.png'
import commentsImage from '~/assets/panel-item-comments.png'
import commentsHighlightedImage from '~/assets/panel-item-comments-highlighted.png'
import commentsSelectedImage from '~/assets/panel-item-comments-selected.png'
import moreImage from '~/assets/panel-item-more.png'
import moreHighlightedImage from '~/assets/panel-item-more-highlighted.png'
import shareImage from '~/assets/panel-item-share.png'
import starImage from '~/assets/panel-item-star.png'
import starSelectedImage from '~/assets/panel-item-star-selected.png'

import { type PanelItem, PanelItemType } from '@/config/panel'

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

const getArchiveTitle = computed(() => {
  if (props.isArchive) {
    return $t('component.sidebar.archieved')
  }
  return $t('component.sidebar.archieve')
})

const panelItems = ref<PanelItem[]>([
  {
    type: PanelItemType.AI,
    icon: aiImage,
    highlighedIcon: aiHighlightedImage,
    selectedIcon: aiSelectedImage,
    title: $t('component.sidebar.ai'),
    hovered: false,
    isSelected: () => props.isSummaryShowing
  },
  {
    type: PanelItemType.Chat,
    icon: chatbotImage,
    highlighedIcon: chatbotHighlightedImage,
    selectedIcon: chatbotSelectedImage,
    title: $t('component.sidebar.chat'),
    hovered: false,
    isSelected: () => props.isChatbotShowing
  }
  // {
  //   type: PanelItemType.Comments,
  //   icon: commentsImage,
  //   highlighedIcon: commentsHighlightedImage,
  //   selectedIcon: commentsSelectedImage,
  //   title: $t('component.sidebar.comments'),
  //   hovered: false,
  //   isSelected: () => false
  // }
])

const morePanelItem = ref<PanelItem[]>([
  {
    type: PanelItemType.Star,
    icon: starImage,
    highlighedIcon: starImage,
    selectedIcon: starSelectedImage,
    title: $t('component.sidebar.star'),
    hovered: false,
    isSelected: () => props.isStar
  },
  {
    type: PanelItemType.Archieve,
    icon: archieveImage,
    highlighedIcon: archieveImage,
    selectedIcon: archieveSelectedImage,
    title: getArchiveTitle,
    hovered: false,
    isSelected: () => props.isArchive
  },
  {
    type: PanelItemType.Share,
    icon: shareImage,
    highlighedIcon: shareImage,
    title: $t('component.sidebar.share'),
    hovered: false
  }
])

const moreShow = ref(false)

const outsideClick = () => {
  moreShow.value = false
}

const panelClick = async (panel: PanelItem) => {
  emits('panel-item-action', panel)
}
</script>

<style lang="scss" scoped>
.sidebar-items {
  --style: w-52px py-6px px-4px bg-#262626 rounded-(lt-8px lb-8px);

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

    .more-options-wrapper {
      --style: cursor-default absolute top-0 -right-4px w-150px h-110px rounded-8px bg-#262626;
      .more-options {
        --style: flex flex-col py-7px opacity-100;

        button.subpanel-button {
          --style: flex items-center h-32px px-16px overflow-hidden whitespace-nowrap text-ellipsis rounded-6px transition-all duration-250;
          --style: 'hover:(bg-#00000029)';

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

          span {
            --style: ml-8px text-(13px #ffffff99) line-height-18px;
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
