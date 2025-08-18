<template>
  <div class="article-comments-view">
    <div class="title">{{ $t('component.article_selection.comments.title') }}</div>
    <div class="comment-list-container">
      <div class="comments-wrapper" ref="commentsWrapper">
        <TransitionGroup name="opacity">
          <ArticleCommentCell
            v-for="(comment, index) in markComments"
            :key="index"
            :comment="comment"
            :userId="bookmarkUserId"
            @replyComment="replyComment"
            @commentDelete="commentDelete"
          />
        </TransitionGroup>
      </div>
    </div>
    <Transition name="opacity">
      <div class="comment-input-container" v-show="commentQuote">
        <div class="comment-quote-container">
          <span>{{ commentQuote }}</span>
        </div>
        <Transition name="input">
          <div class="comment-input" v-show="showInput">
            <div class="comment-input-wrapper">
              <textarea
                ref="textarea"
                v-model="inputText"
                v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
                :placeholder="textareaPlaceholder"
                @compositionstart="compositionstart"
                @compositionend="compositionend"
                @input="handleInput"
              >
              </textarea>
              <button :class="{ disabled: !sendable }" class="bg-[url('@/assets/button-tiny-send-dark.png')]" @click="sendMessage"></button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
const convertComment = (comment: MarkCommentInfo): MarkCommentInfo => {
  const { children, ...detail } = comment
  return {
    ...detail,
    children: children.map(convertComment)
  }
}
</script>

<script lang="ts" setup>
import ArticleCommentCell from './ArticleCommentCell.vue'

import { type MarkCommentInfo, type MarkItemInfo } from './type'
import { vOnKeyStroke } from '@vueuse/components'

const props = defineProps({
  isAppeared: {
    required: false,
    type: Boolean
  },
  commentQuote: {
    required: false,
    type: String
  },
  comments: {
    required: true,
    type: Object as PropType<MarkCommentInfo[]>
  },
  infos: {
    required: false,
    type: Object as PropType<MarkItemInfo[]>
  },
  currentInfo: {
    required: false,
    type: Object as PropType<MarkItemInfo>
  },
  bookmarkUserId: {
    required: true,
    type: Number
  },
  allowAction: {
    required: true,
    type: Boolean
  }
})

const emits = defineEmits(['action'])

const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
const textareaPlaceholder = ref($t('component.article_selection.placeholder'))
const markComments = ref<MarkCommentInfo[]>(props.comments.map(item => convertComment(item)))
const compositionAppear = ref(false)
const textarea = ref<HTMLTextAreaElement>()
const commentsWrapper = ref<HTMLDivElement>()
const inputText = ref('')
const showInput = ref(true)
const sendable = computed(() => {
  return inputText.value.trim().length > 0
})

watch(
  () => props.comments,
  () => {
    const insertNewRootComment = props.comments?.length && markComments.value?.length && props.comments.length > markComments.value.length

    if (!props.comments) {
      markComments.value = []
    }

    if (!props.comments) {
      markComments.value = []
    } else {
      markComments.value = props.comments.map(item => convertComment(item))
    }

    if (insertNewRootComment) {
      nextTick(() => {
        commentsWrapper.value?.scrollTo({
          top: commentsWrapper.value.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  },
  {
    // deep: true
  }
)

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || compositionAppear.value) {
    return
  }

  const commonPreLineKey = e.ctrlKey || e.shiftKey
  if ((commonPreLineKey && !isMac) || ((commonPreLineKey || e.metaKey) && isMac)) {
    if (!e.target || !(e.target instanceof HTMLTextAreaElement)) {
      return
    }

    const textareaTarget = e.target as HTMLTextAreaElement
    const cursorPosition = textareaTarget.selectionStart
    const textBeforeCursor = inputText.value.slice(0, cursorPosition)
    const textAfterCursor = inputText.value.slice(cursorPosition)
    !e.shiftKey && (inputText.value = textBeforeCursor + '\n' + textAfterCursor)

    nextTick(() => {
      textareaTarget.selectionStart = cursorPosition + 1
      textareaTarget.selectionEnd = cursorPosition + 1
      handleInput()
    })
  } else {
    sendMessage()
    e.preventDefault()
  }
}

onMounted(() => {
  handleInput()
})

const compositionstart = () => {
  compositionAppear.value = true
}

const compositionend = () => {
  compositionAppear.value = false
}

const shakeTextarea = () => {
  if (!textarea.value) {
    return
  }

  textarea.value.classList.add('shake')
  textarea.value.addEventListener(
    'animationend',
    () => {
      textarea.value?.classList.remove('shake')
    },
    { once: true }
  )
}

const sendMessage = () => {
  if (!sendable.value) {
    shakeTextarea()
    return
  }

  emits('action')

  inputText.value = ''
  showInput.value = false
  nextTick(() => {
    handleInput()
  })
}

const handleInput = () => {
  if (!textarea.value) {
    return
  }

  textarea.value.style.height = '22px'
  textarea.value.style.height = textarea.value.scrollHeight + 'px'
}

const replyComment = (options: { replyToId: number; comment: string }) => {
  const { replyToId, comment } = options
}

const commentDelete = (comment: MarkCommentInfo) => {}
</script>

<style lang="scss" scoped>
.article-comments-view {
  --style: size-full flex flex-col bg-#262626 justify-between;

  .title {
    --style: pt-24px px-24px pb-12px text-(16px #999) line-height-22px;
  }

  .comment-list-container {
    --style: flex-1 overflow-hidden relative;

    &::before,
    &::after {
      --style: z-2 content-empty absolute h-6px w-full left-0 from-#262626 to-transprent;
    }

    &::before {
      --style: bottom-0 bg-gradient-to-t;
    }

    &::after {
      --style: top-0 bg-gradient-to-b;
    }

    .comments-wrapper {
      --style: pt-12px pb-24px px-24px h-full overflow-auto;

      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        --style: hidden;
      }
    }
  }

  .comment-input-container {
    --style: border-t-(1px solid #ffffff0f) pt-20px px-24px pb-16px;

    .comment-quote-container {
      --style: pl-8px mb-20px border-l-(2px solid #ffffff14) line-clamp-2 text-(15px #ffffff66) break-all;

      span {
        --style: line-height-21px overflow-hidden;
      }
    }

    .comment-quote-container + .comment-input {
      --style: ;
    }

    .comment-input {
      --style: max-h-300px overflow-hidden;

      .comment-input-wrapper {
        --style: pl-16px pt-16px pr-20px pb-14px w-full relative bg-#1a1a1aff border-(1px solid #1a1a1aff) rounded-8px flex flex-col justify-between;
        textarea {
          --style: resize-none min-h-40px max-h-200px text-(16px #ffffffcc) line-height-24px bg-transparent;
          &::placeholder,
          &::-webkit-input-placeholder {
            --style: text-(16px #ffffff66) line-height-24px;
          }
        }

        button {
          --style: mt-10px self-end w-20px h-20px bg-contain transition-transform duration-250;

          &.disabled {
            --style: opacity-50 cursor-auto;
          }

          &:not(.disabled) {
            &:hover {
              --style: scale-105;
            }

            &:active {
              --style: scale-115;
            }
          }
        }
      }
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-2px);
  }
  40%,
  80% {
    transform: translateX(2px);
  }
}

// eslint-disable-next-line vue-scoped-css/no-unused-selector
textarea.shake {
  animation: shake 0.5s;
}

.input-leave-to,
.input-enter-from {
  --style: '!max-h-0px !mt-0 opacity-0';
}

.input-enter-active,
.input-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
