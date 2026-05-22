<template>
  <div class="bookmark-panel" ref="panel">
    <div class="panel-wrapper pro" v-if="canShowPanelButton(BookmarkPanelType.CHATBOT)">
      <div class="item" v-if="canShowPanelButton(BookmarkPanelType.CHATBOT)">
        <button @click="buttonClick(BookmarkPanelType.CHATBOT)">
          <img src="@images/panel-item-chatbot.png" alt="" />
          <span>{{ $t('page.bookmarks_detail.chat') }}</span>
        </button>
      </div>
      <div class="item ai-expanded" v-if="canShowPanelButton(BookmarkPanelType.AI)">
        <button @click="buttonClick(BookmarkPanelType.AI)">
          <img src="@images/panel-item-ai.png" alt="" />
          <span>{{ $t('page.bookmarks_detail.ai_analyze') }}</span>
        </button>
      </div>
    </div>
    <div class="panel-wrapper">
      <div class="item" v-if="canShowPanelButton(BookmarkPanelType.ARCHIVE)">
        <button @click="buttonClick(BookmarkPanelType.ARCHIVE)">
          <img src="@images/panel-item-archive.png" alt="" />
          <span> {{ $t('common.operate.archive') }} </span>
        </button>
      </div>
      <div class="item" v-if="canShowPanelButton(BookmarkPanelType.UNARCHIVE)">
        <button @click="buttonClick(BookmarkPanelType.UNARCHIVE)">
          <img src="@images/panel-item-archive.png" alt="" />
          <span> {{ $t('common.operate.unarchive') }} </span>
        </button>
      </div>
      <div class="item" v-if="canShowPanelButton(BookmarkPanelType.TOP)">
        <button @click="buttonClick(BookmarkPanelType.TOP)">
          <img src="@images/panel-item-top.png" alt="" />
          <span>{{ $t('common.operate.top') }}</span>
        </button>
      </div>
    </div>
    <div class="feedback-wrapper" v-if="canShowPanelButton(BookmarkPanelType.FEEDBACK)">
      <button @click="buttonClick(BookmarkPanelType.FEEDBACK)">
        <img src="~@images/button-feedback-icon.png" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
export enum BookmarkPanelType {
  AI = 'ai',
  CHATBOT = 'chatbot',
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  TOP = 'top',
  FEEDBACK = 'feedback'
}
</script>
<script setup lang="ts">
const props = defineProps({
  types: {
    type: Array as PropType<BookmarkPanelType[]>,
    default: () => []
  }
})

const emits = defineEmits(['panelClick'])

const buttonClick = (type: BookmarkPanelType) => {
  emits('panelClick', type)
}

const canShowPanelButton = (type: BookmarkPanelType) => {
  return props.types.includes(type)
}
</script>

<style lang="scss" scoped>
.bookmark-panel {
  .panel-wrapper {
    --style: 'relative w-68px border-(1px solid #a8b1cd3d) rounded-2 flex flex-col bg-transparent not-first:mt-10px overflow-hidden';

    &.pro {
      // #E9C596 Pro 标签金黄边框（与 :before 同色），保留
      --style: border-#E9C596 pt-20px;

      &:before {
        // #E9C596 是 Pro 标签的金黄底色，与 tags 金黄系列同源，保留
        --style: absolute top-0 left-0 w-full h-20px bg-#E9C596 flex-center font-600 text-(tag txt-btn);
        content: 'Pro';
      }
    }

    .item {
      --style: py-5px px-8px relative flex-center;

      &:not(:first-child) {
        &::before {
          // bg-#ecf0f5 浅蓝灰分隔线辅助色，保留
          --style: 'content-empty absolute w-36px h-1px bg-#ecf0f5 top-0 left-1/2 -translate-x-1/2';
        }
      }

      button {
        --style: 'w-full py-15px rounded-2 flex flex-col items-center justify-center hover:(bg-surface) transition-all duration-250 active:(scale-110)';
        img {
          --style: w-6 h-6;
        }

        span {
          --style: mt-4px text-(tag txt-light) line-height-14px text-align-center;
        }
      }
    }
  }

  .feedback-wrapper {
    --style: mt-35px w-68px flex-center;
    button {
      // #a8b1cd14 蓝灰辅助边框、#00000014 浮动按钮阴影：保留
      --style: 'rounded-full bg-surface-solid w-42px h-42px border-(1px solid #a8b1cd14) hover:(bg-surface) active:(scale-110) transition-all duration-250';
      box-shadow: 0px 15px 30px 0px #00000014;

      img {
        --style: w-18px h-17px object-contain;
      }
    }
  }
}
</style>
