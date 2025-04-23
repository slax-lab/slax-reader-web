<template>
  <div class="bubble-message" :class="{ copyable: showCopyBtn, left: message.direction === 'left', right: message.direction === 'right' }">
    <div class="quote-container" v-if="message.quote && message.quote.data.length > 0" @click="quoteClick(message.quote)">
      <div class="quote">
        <i class="img bg-[url('@images/tiny-image-icon.png')]" v-if="showQuoteImage"></i>
        <span v-for="item in message.quote.data" :key="item.content">{{ item.content }}</span>
      </div>
    </div>
    <div v-for="(content, index) in message.contents" :key="index">
      <template v-if="content.type === 'text'">
        <div class="text" v-if="!content.isHTML">
          {{ content.content }}
        </div>
        <div class="text" v-else v-html="content.content"></div>
      </template>
      <template v-else-if="content.type === 'links'">
        <div class="group links">
          <div class="links-title">{{ $t('component.chat_bubble_message.links_source') }}</div>
          <div class="links-content">
            <div class="content-wrapper">
              <div class="link-content" v-for="link in content.content" :key="link.url" @click="linkClick(link.url)">
                <div class="title">{{ link.title }}</div>
                <div class="href">
                  <!-- <i class="i-solar:link-minimalistic-2-linear"></i> -->
                  <img :src="link.icon" :width="12" :height="12" />
                  <span>{{ parseHref(link.url) }}</span>
                </div>
              </div>
            </div>
            <div class="operate group-hover:!opacity-100">
              <button class="left" @click="linksLeftOperateClick">
                <img src="@images/button-tiny-right-arrow-outline.png" alt="" />
              </button>
              <button class="right" @click="linksRightOperateClick">
                <img src="@images/button-tiny-right-arrow-outline.png" alt="" />
              </button>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="content.type === 'tips'">
        <div class="tips">
          <span :class="{ loading: content.loading }">{{ content.tips }}</span>
        </div>
      </template>
      <template v-else-if="content.type === 'related-question'">
        <div class="related-question">
          <div class="related-question-title">{{ $t('component.chat_bubble_message.related_questions') }}</div>
          <div class="related-question-content">
            <div class="question" v-for="question in content.questions" :key="question.content" @click="questionClick(question)">
              <span class="text">{{ question.content }}</span>
              <i class="bg-[url('@images/button-tiny-bottom-search.png')]"></i>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="btns-container" v-if="showCopyBtn">
      <button class="copy-btn" @click="copyBtnClick">
        <img src="@images/button-tiny-copy.png" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { copyText } from '@commons/utils/string'

import { type BubbleMessageItem, type QuoteData } from './type'
import Toast, { ToastType } from '#layers/core/components/Toast'

const emits = defineEmits(['questionClick', 'quoteClick'])
const props = defineProps({
  message: {
    type: Object as PropType<BubbleMessageItem>,
    required: true
  }
})

const { t } = useI18n()
const showCopyBtn = computed(() => {
  const isBuffering = props.message.isBuffering
  const isLeftMessage = props.message.direction === 'left'
  const hasTextMessage = props.message.contents?.some(content => content.type === 'text')
  return !isBuffering && isLeftMessage && hasTextMessage
})

const showQuoteImage = computed(() => {
  return props.message.quote && props.message.quote.data.length > 0 && !!props.message.quote.data.find(item => item.type === 'image')
})

const parseHref = (href: string) => {
  const url = new URL(href)
  const hostname = url.hostname
  const items = hostname.split('.')
  return items.length <= 2 ? items[0] : items[1]
}

const queryContentWrapperElement = (e: PointerEvent) => {
  console.log(e)
  let parentContainer = null
  if (e.target instanceof HTMLImageElement) {
    parentContainer = (e.target as HTMLImageElement).parentElement?.parentElement?.parentElement
  } else if (e.target instanceof HTMLButtonElement) {
    parentContainer = (e.target as HTMLButtonElement).parentElement?.parentElement
  }

  if (!parentContainer) {
    return null
  }

  const contentWrapper = parentContainer.querySelector('.content-wrapper')
  return contentWrapper as HTMLDivElement
}

const linksLeftOperateClick = (e: MouseEvent) => {
  const contentWrapper = queryContentWrapperElement(e as PointerEvent)
  contentWrapper?.scrollTo({
    left: contentWrapper.scrollLeft - 320,
    behavior: 'smooth'
  })
}

const linksRightOperateClick = (e: MouseEvent) => {
  const contentWrapper = queryContentWrapperElement(e as PointerEvent)
  contentWrapper?.scrollTo({
    left: contentWrapper.scrollLeft + 320,
    behavior: 'smooth'
  })
}

const linkClick = (href: string) => {
  window.open(href)
}

const copyBtnClick = async () => {
  const contentText =
    props.message.contents
      ?.filter(content => content.type === 'text')
      .map(content => content.rawContent || '')
      .join('\n') || ''

  const processedText = contentText
    .split('\n')
    .map(line => {
      if (/^\s*-/.test(line)) {
        return line.replace('-', '·')
      } else if (line.startsWith('#')) {
        return line.replace(/^#+\s/, '\n')
      }
      return line
    })
    .join('\n')
    .trim()

  await copyText(processedText)
  Toast.showToast({
    text: t('common.tips.copy_content_success'),
    type: ToastType.Success
  })
}

const questionClick = (question: { content: string; rawContent?: string }) => {
  emits('questionClick', props.message, question)
}

const quoteClick = (quote: QuoteData) => {
  emits('quoteClick', quote)
}
</script>

<style lang="scss" scoped>
.bubble-message {
  --style: relative bg-#F5F5F3 min-h-10 min-w-300px rounded-8px p-16px;

  &.copyable {
    --style: '!pb-48px';
  }

  &.left {
    --style: ml-0 mr-auto justify-start bg-#F5F5F3 text-(#333) mr-50px;
  }

  &.right {
    --style: mr-0 my-8px ml-auto justify-end bg-#333 text-(#fcfcfc) min-w-auto max-w-366px;
  }

  & > * {
    --style: 'not-first:mt-16px';
  }

  .quote-container {
    --style: flex items-center justify-between cursor-pointer;
    .quote {
      --style: pl-8px border-l-(2px solid #fcfcfc29) line-clamp-2 text-(15px #fcfcfc99);
      i.img {
        --style: w-13px h-13px inline-block bg-contain mr-4px translate-y-2px;
      }

      span {
        --style: line-height-21px overflow-hidden;
      }
    }
  }

  .text {
    --style: flex flex-col text-(15px) line-height-22px whitespace-pre-line;

    &::v-deep(& :not(code)) {
      --style: m-0 text-#0f1419;
    }

    &::v-deep(.hljs) {
      --style: bg-#33333314;
    }

    &::v-deep(pre) {
      --style: mt-16px;
    }

    &::v-deep(h1) {
      --style: 'font-bold text-(20px) line-height-28px not-first:mt-32px';
    }

    &::v-deep(h2) {
      --style: 'font-bold text-(16px) line-height-22px not-first:mt-22px';
    }

    &::v-deep(h3),
    &::v-deep(h4),
    &::v-deep(h5) {
      --style: 'font-bold text-(15px) not-first:mt-12px';
    }

    // 非标题类内容，在前面有内容时才增加间距
    &::v-deep(* + ul),
    &::v-deep(* + ol) {
      --style: mt-10px;
      margin-top: 10px;
    }

    &::v-deep(li) {
      --style: relative pl-20px box-border font-normal text-(14px) line-height-20px whitespace-normal;
    }

    &::v-deep(ul),
    &::v-deep(ol) {
      --style: list-none whitespace-normal;
    }

    &::v-deep(ul) {
      --style: pl-0 flex flex-col;
      li {
        &::marker {
          --style: content-none hidden text-#a8b1cd;
        }

        & li {
          &::marker {
            --style: content-none hidden text-#a8b1cd;
          }
          &:before {
            --style: box-border top-8px left-4px w-4px h-4px border border-#a8b1cd border-solid bg-#fff;
          }
        }

        &:not(:first-child) {
          --style: 'not-first:mt-14px';
        }

        &:before {
          --style: absolute top-8px left-4px w-4px h-4px bg-#a8b1cd content-empty rounded;
        }
      }
    }

    &::v-deep(ol) {
      --style: pl-0 flex flex-col;
      counter-reset: list-counter;

      & > li {
        counter-increment: list-counter;
        &::marker {
          --style: content-empty;
        }

        &:not(:first-child) {
          --style: 'not-first:mt-14px';
        }

        &::before {
          --style: 'content-empty !absolute rounded-full top-0px left-4px';
          content: counter(list-counter) '. '; /* 显示计数器 */
        }
      }
    }

    &::v-deep(a) {
      --style: text-#5490C2 underline-none border-none decoration-none cursor-pointer;
    }

    &::v-deep(table) {
      --style: border-collapse;
    }

    &::v-deep(thead),
    &::v-deep(td),
    &::v-deep(tr),
    &::v-deep(th) {
      --style: border-(1px solid #9999991a) p-4px text-align-center;
    }

    &::v-deep(* + p) {
      --style: mt-22px;
    }

    &::v-deep(code) {
      font-family: 'Courier New', Courier, monospace !important;

      * {
        font-family: 'Courier New', Courier, monospace !important;
      }
    }
  }

  .links {
    --style: relative w-full;

    .links-title {
      --style: text-(12px #999) line-height-17px;
    }

    .links-content {
      --style: mt-6px w-full relative;
      &::before {
        --style: content-empty absolute w-5px h-full right-0px top-0 bg-gradient-to-l from-#F5F5F3 to-transprent z-2;
      }

      &::after {
        --style: content-empty absolute w-5px h-full -left-5px top-0 bg-gradient-to-r from-#F5F5F3 to-transprent z-2;
      }

      .content-wrapper {
        --style: w-calc(100% + 5px) -ml-5px px-5px overflow-x-auto flex flex-nowrap relative;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          --style: hidden;
        }
        .link-content {
          --style: 'flex flex-col justify-between p-8px w-160px h-69px bg-#ffffffcc border-(1px solid #9999991a) shrink-0 rounded-4px not-first:ml-8px cursor-pointer transition-all duration-250 hover:(bg-#ffffff)';

          .title {
            --style: text-(12px #333) line-height-17px line-clamp-2;
          }

          .href {
            --style: flex items-center text-(12px #999);

            i {
              --style: w-9px h-8px;
            }

            span {
              --style: ml-5px line-height-17px;
            }
          }
        }
      }

      .operate {
        --style: 'absolute right-0 top-0 -translate-y-full flex pb-9px opacity-0 transition-opacity duration-250';

        button {
          --style: w-11px h-10px flex-center rounded-full transition-transform duration-250;

          &:hover {
            --style: scale-105;
          }
          img {
            --style: w-11px h-10px object-center;
          }
        }

        .left {
          --style: left-0 rotate-180;
        }

        .right {
          --style: right-0;
        }
      }
    }
  }

  .tips {
    --style: flex items-center;
    span {
      --style: text-(12px #999) line-height-17px;

      &.loading {
        animation: loading 1.5s linear infinite;
      }
    }

    @keyframes loading {
      0% {
        opacity: 100%;
      }

      50% {
        opacity: 50%;
      }

      100% {
        opacity: 100%;
      }
    }
  }

  .related-question {
    --style: max-w-366px;
    .related-question-title {
      --style: text-(12px #999) line-height-17px;
    }

    .related-question-content {
      --style: mt-10px;
      .question {
        --style: 'py-0px pl-16px flex items-center justify-between relative not-first:mt-10px cursor-pointer';

        &::before {
          --style: content-empty absolute left-0 top-1/2 w-4px h-4px bg-#a8b1cd -translate-y-1/2 rounded-2px;
        }

        span {
          --style: text-(15px #333) line-height-22px;
        }

        i {
          --style: shrink-0 w-16px h-16px bg-contain transition-transform duration-250 ml-12px;
        }
      }
    }
  }

  .btns-container {
    --style: absolute left-16px bottom-16px flex;

    .copy-btn {
      --style: 'w-16px h-16px flex-center rounded-3px bg-contain hover:(bg-#ebebeb scale-105) active:(scale-110) transition-all duration-250 ease-in-out';
      img {
        --style: w-full h-full object-contain;
      }
    }
  }
}
</style>
