<template>
  <Transition name="chat">
    <div class="chat-bot" ref="chat" v-show="isAppeared">
      <div class="chat-header">
        <div class="chat-title">
          <img src="@/assets/panel-item-chatbot.png" alt="" />
          <span>{{ $t('component.chat_bot.hello') }}</span>
        </div>
        <button class="close" @click="closeModal">
          <img src="@/assets/button-dialog-close.png" />
        </button>
      </div>
      <div class="messages-container">
        <div class="messages" ref="messages">
          <div class="message" v-for="message in messageList" :key="message.id">
            <template v-if="message.type === 'question'">
              <QuestionMessage :question="message" @question-click="questionClick" />
            </template>
            <template v-if="message.type === 'bubble'">
              <BubbleMessage :message="message" @question-click="relatedQuestionClick" @quote-click="quoteClick" />
            </template>
            <template v-if="message.type === 'tips'">
              <TipsMessage :tips="message" />
            </template>
          </div>
          <div class="message" v-if="bufferMessage">
            <BubbleMessage :message="bufferMessage" />
          </div>
          <div class="loading" v-if="isChatting">
            <DotLoading indicate-color="#3333333d" />
          </div>
        </div>
      </div>
      <div class="bottom-container">
        <div class="quote-container" v-if="quoteInfo && quoteInfo.data.length > 0">
          <div class="quote">
            <i class="img bg-[url('@/assets/tiny-image-icon.png')]" v-if="showQuoteImage"></i>
            <span v-for="item in quoteInfo.data" :key="item.content">{{ item.content }}</span>
          </div>
          <button class="bg-[url('@/assets/button-circle-close.png')]" @click="closeQuote"></button>
        </div>
        <div class="input-container">
          <div class="textarea-wrapper">
            <textarea
              ref="textarea"
              v-model="inputText"
              v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
              :placeholder="textareaPlaceholder"
              @compositionstart="compositionstart"
              @compositionend="compositionend"
              @input="handleInput"
            ></textarea>
            <button :class="{ disabled: !sendable }" class="bg-[url('@/assets/button-tiny-send.png')]" @click="sendMessage"></button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import DotLoading from './../DotLoading.vue'
import BubbleMessage from './BubbleMessage.vue'
import QuestionMessage from './QuestionMessage.vue'
import TipsMessage from './TipsMessage.vue'

import { parseMarkdownText } from '@commons/utils/parse'
import { getUUID } from '@commons/utils/random'

import 'highlight.js/styles/base16/equilibrium-gray-light.css'
import type { BubbleMessageContent, BubbleMessageItem, MessageItem, QuestionMessageItem, QuoteData } from './type'
import { vOnKeyStroke } from '@vueuse/components'

const props = defineProps({
  bookmarkId: Number,
  shareCode: String,
  collection: {
    type: Object as PropType<{ code: string; cbId: number }>,
    required: false
  },
  isAppeared: {
    required: false,
    type: Boolean
  }
})

const emits = defineEmits(['dismiss', 'findQuote'])
const botParams: ChatBotParams = (() => {
  if (props.bookmarkId) {
    return { bookmarkId: props.bookmarkId }
  } else if (props.shareCode) {
    return { shareCode: props.shareCode }
  } else if (props.collection) {
    return { collection: props.collection }
  } else {
    return { bookmarkId: 0 }
  }
})()

const bot = new ChatBot(botParams, (params: { type: ChatResponseType; data: ChatResponseData }) => {
  // 负责处理chatbot消息的回复
  const { type, data } = params
  if (type === ChatResponseType.FUNCTION) {
    if (!data[type]) {
      return
    }

    const { name, args } = data[type]

    if (name === 'generateQuestion' && args) {
      bufferMessage.value = null
      const noQuestionMessage = !messageList.value.find(item => item.type === 'question' || (item.type === 'tips' && item.tipsType === 'generateQuestion'))

      if (noQuestionMessage) {
        messageList.value.push({
          id: `tips_generate_question`,
          type: 'tips',
          tipsType: 'generateQuestion'
        })
      }

      messageList.value = messageList.value.concat(
        args.map((item: string) => {
          return {
            type: 'question',
            text: getParsedText(item),
            clickable: true,
            id: `question_${item}`,
            isHTML: true,
            rawContent: item
          }
        })
      )

      scrollToBottom()
    } else if (name === 'relatedQuestion' && args) {
      pushBuffer({
        type: 'related-question',
        questions: [
          {
            content: args,
            rawContent: args
          }
        ]
      })
    } else if (name === 'search' && args) {
      pushBuffer({
        type: 'links',
        content: args
      })
    }
  } else if (type === ChatResponseType.CONTENT) {
    pushBuffer({
      type: 'text',
      content: data[type] || ''
    })
  } else if (type === ChatResponseType.STATUS_UPDATE) {
    if (!data[type]) {
      return
    }

    const { name, tips, status } = data[type]
    if (status === 'processing') {
      if (name === 'generateQuestion') {
        pushBuffer({
          type: 'tips',
          tips: $t(`component.chat_bot.generating_question`),
          loading: true,
          tipsType: name
        })
      } else if (name === 'browser') {
        // pushBuffer({
        //   type: 'tips',
        //   tips: tips ? $t(`component.chat_bot.{tips}_accessing`, { tips }) : $t('component.chat_bot.now_accessing'),
        //   loading: true,
        //   tipsType: name
        // })
      } else if (name === 'search') {
        pushBuffer({
          type: 'tips',
          tips: tips, //$t(`component.chat_bot.{tips}_searching`, { tips }),
          loading: true,
          tipsType: name
        })
      }
    } else if (status === 'finished') {
      if (name === 'browser') {
        updateTipsBrowserStatus(true)
      } else {
        discardSearch()
      }
    } else if (status === 'failed') {
      if (name === 'browser') {
        updateTipsBrowserStatus(false)
      }
    }
  }
})

bot.chatStatusUpdateHandler = (chatting: boolean) => {
  isChatting.value = chatting

  if (!chatting) {
    const result = bufferToMessage()
    if (result) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  }
}

const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
const textareaPlaceholder = $t(`component.chat_bot.alias_placeholder`, [isMac ? 'cmd' : 'ctrl'])
const compositionAppear = ref(false)
const isInited = ref(false)
const chat = ref<HTMLDivElement>()
const messages = ref<HTMLDivElement>()
const textarea = ref<HTMLTextAreaElement>()
const inputText = ref('')
const isChatting = ref(false)
const messageList = ref<MessageItem[]>([])
const bufferMessage = ref<BubbleMessageItem | null>(null)
const bufferMarkdownContent = ref('') // 用于缓存解析中的markdown文字内容
const quoteInfo = ref<QuoteData | null>(null)
const sendable = computed(() => {
  return inputText.value.trim().length > 0 && !isChatting.value
})

const showQuoteImage = computed(() => {
  return quoteInfo.value && quoteInfo.value.data.length > 0 && !!quoteInfo.value.data.find(item => item.type === 'image')
})

watch(
  () => props.isAppeared,
  value => {
    if (value && !isInited.value && !quoteInfo.value) {
      isInited.value = true

      bot.chat({
        type: ChatParamsType.QUESTIONS
      })
    }

    if (value) {
      nextTick(() => {
        textarea.value?.focus()
      })
    }
  },
  {
    flush: 'sync',
    immediate: true
  }
)

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  bot.destruct()
})

const handleInput = () => {
  if (!textarea.value) {
    return
  }

  textarea.value.style.height = '22px'
  textarea.value.style.height = textarea.value.scrollHeight + 'px'
}

const scrollToBottom = (force?: boolean) => {
  if (!messages.value) {
    return
  }

  const scrollTick = () => {
    nextTick(() => {
      messages.value?.scrollTo({
        top: messages.value.scrollHeight,
        behavior: 'smooth'
      })
    })
  }

  if (force) {
    scrollTick()
    return
  }

  const isNearBottom = messages.value.scrollHeight - messages.value.scrollTop - messages.value.clientHeight < 200
  if (isNearBottom) {
    scrollTick()
  }
}

const sendMessage = () => {
  if (!sendable.value) {
    shakeTextarea()
    return
  }

  const history = getHistoryMessages()
  const text = inputText.value.trim()
  messageList.value.push({
    type: 'bubble',
    direction: 'right',
    contents: [
      {
        type: 'text',
        content: text
      }
    ],
    quote: quoteInfo.value ? quoteInfo.value : undefined,
    id: `bubble_right_${text}`
  })

  bot.chat({
    type: ChatParamsType.CONTENT,
    content: text,
    history,
    quote: quoteInfo.value ? quoteInfo.value : undefined
  })

  inputText.value = ''
  quoteInfo.value = null
  scrollToBottom()

  nextTick(() => {
    handleInput()
  })
}

const closeModal = () => {
  emits('dismiss')
}

const questionClick = (question: QuestionMessageItem) => {
  if (isChatting.value) {
    return
  }

  question.clickable = false
  const questionsRange: number[] = [] // 存储点击问题的对应问题列，点击问题后需要把该问题端的问题发送给bot，然后清空这一区域的问题（除了点击的那个问题外）
  let inQuestionQueue = false
  let findQuestion = false
  for (let i = 0; i < messageList.value.length; i++) {
    const messageItem = messageList.value[i]
    if (messageItem.type === 'question') {
      inQuestionQueue = true
    } else {
      inQuestionQueue = false
    }

    if (messageItem === question) {
      findQuestion = true
    }

    if (inQuestionQueue) {
      questionsRange.push(i)
    } else {
      if (findQuestion) {
        // 说明已经找完了对应问题段，可以退出了
        break
      } else {
        // 没有找到，得继续走
        questionsRange.length = 0
      }
    }
  }

  if (!findQuestion) {
    questionsRange.length = 0
  }

  // const questiontText = messageList.value
  //   .filter((item, idx) => item.type === 'question' && questionsRange.includes(idx))
  //   .map(item => (item as QuestionMessageItem).rawContent || '')
  messageList.value = messageList.value.filter((item, idx) => {
    if (item.type === 'question' && item !== question && item.clickable && questionsRange.includes(idx)) {
      return false
    }

    return true
  })

  if (!question.rawContent) return

  bot.chat({
    type: ChatParamsType.ASK,
    questions: question.rawContent
  })
}

const quoteClick = (quote: QuoteData) => {
  emits('findQuote', quote)
}

const relatedQuestionClick = (message: BubbleMessageItem, question: { content: string; rawContent?: string }) => {
  if (isChatting.value) {
    return
  }

  const index = messageList.value.findIndex(item => item === message)
  if (index === -1) {
    console.error('can not find the message')
    return
  }

  messageList.value.splice(index, 1)
  messageList.value.push({
    id: `question_${question.rawContent}`,
    type: 'question',
    text: question.content,
    clickable: false,
    isHTML: true,
    rawContent: question.rawContent
  })

  bot.chat({
    type: ChatParamsType.ASK,
    questions: question.content
  })
}

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

const pushBuffer = (content: BubbleMessageContent) => {
  if (!bufferMessage.value) {
    bufferMessage.value = {
      type: 'bubble',
      direction: 'left',
      contents: [],
      isBuffering: true,
      id: `bubble_buffer`
    }
  }

  if (!bufferMessage.value.contents) {
    bufferMessage.value.contents = []
  }

  const contents = bufferMessage.value.contents
  if (content.type === 'links' || content.type === 'tips') {
    contents.push(content)
    bufferMarkdownContent.value = ''
  } else if (content.type === 'related-question') {
    if (bufferMessage.value && bufferMessage.value.contents && bufferMessage.value.contents.length > 0 && bufferMessage.value.contents[0].type !== 'related-question') {
      bufferToMessage()
      // TODO 优化这里
      bufferMessage.value = {
        type: 'bubble',
        direction: 'left',
        contents: [] as BubbleMessageContent[],
        isBuffering: true,
        id: `bubble_buffer`
      }
    }

    // 上面的bufferToMessage会改变bufferMessage的数据，所以这里需要重新判断
    const newBufferMessageContents = bufferMessage.value.contents
    if (newBufferMessageContents?.length === 0) {
      newBufferMessageContents.push(content)
    } else {
      const lastContent = newBufferMessageContents?.[newBufferMessageContents.length - 1]
      if (content.type !== lastContent?.type) {
        newBufferMessageContents?.push(content)
      } else {
        lastContent.questions = lastContent.questions.concat(content.questions)
      }
    }

    bufferMarkdownContent.value = ''
  } else {
    if (contents.length === 0) {
      bufferMarkdownContent.value = content.content
      content.content = getParsedText(bufferMarkdownContent.value)
      content.rawContent = bufferMarkdownContent.value
      content.isHTML = true
      contents.push(content)
    } else {
      const lastContent = contents[contents.length - 1]
      if (content.type !== lastContent.type) {
        bufferMarkdownContent.value = content.content
        content.content = getParsedText(bufferMarkdownContent.value)
        content.rawContent = bufferMarkdownContent.value
        content.isHTML = true
        contents.push(content)
      } else {
        bufferMarkdownContent.value += content.content

        lastContent.content = getParsedText(bufferMarkdownContent.value)
        lastContent.rawContent = bufferMarkdownContent.value
      }
    }
  }

  scrollToBottom()
}

const bufferToMessage = () => {
  bufferMarkdownContent.value = ''
  if (bufferMessage.value && (bufferMessage.value.contents || []).length > 0) {
    // 插入buffer消息进消息列表
    bufferMessage.value.isBuffering = false
    bufferMessage.value.id = `bubble_${getUUID()}_${new Date().getTime()}`
    messageList.value.push(bufferMessage.value)

    bufferMessage.value = null
    discardSearch()

    return true
  }

  return false
}

const updateTipsBrowserStatus = (success: boolean) => {
  const browerMessage = bufferMessage.value?.contents?.find(content => content.type === 'tips' && content.tipsType === 'browser' && content.loading)
  if (!browerMessage || browerMessage.type !== 'tips') {
    return
  }

  const tipsText = success ? $t('component.chat_bot.access_complete') : $t('component.chat_bot.access_failed')
  if (browerMessage.tips === $t('component.chat_bot.now_accessing')) {
    browerMessage.tips = tipsText
  } else {
    const reg = new RegExp(`${$t('component.chat_bot.accessing_token')}\.\.\.$`)
    browerMessage.tips = browerMessage.tips.replace(reg, tipsText)
  }
  browerMessage.loading = false
}

const discardSearch = () => {
  if (!bufferMessage.value || !bufferMessage.value.contents || bufferMessage.value.contents.length === 0) {
    return
  }

  bufferMessage.value.contents = bufferMessage.value.contents.filter(item => item.type !== 'tips' || (item.type === 'tips' && !item.loading))
}

const botSize = () => {
  if (!chat.value) {
    return null
  }

  const style = window.getComputedStyle(chat.value)

  return {
    width: Number(style.width.indexOf('px') !== -1 ? style.width.replace('px', '') : style.width),
    height: Number(style.height.indexOf('px') !== -1 ? style.height.replace('px', '') : style.height)
  }
}

const getHistoryMessages = () => {
  const history = messageList.value
    .filter(data => data.type === 'bubble')
    .map(data => {
      const content =
        data.contents
          ?.filter(content => content.type === 'text')
          .map(content => content.rawContent || content.content)
          .join('\n') || ''
      return {
        role: data.direction === 'left' ? 'assistant' : 'user',
        content
      }
    })
    .filter(data => data.content.length > 0) as { role: 'assistant' | 'user'; content: string }[]

  if (history.length > 5) {
    history.reverse()
    history.length = 5
    history.reverse()
  }

  return history
}

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

const getParsedText = (markdownText: string) => {
  return parseMarkdownText(markdownText).replace(/<a/g, '<a target="_blank"') || ''
}

const addQuoteData = (data: QuoteData) => {
  quoteInfo.value = data
}

const closeQuote = () => {
  quoteInfo.value = null
}

defineExpose({
  botSize,
  addQuoteData
})
</script>

<style lang="scss" scoped>
.chat-bot {
  --style: w-full h-full bg-#262626FF flex flex-col justify-stretch items-center overflow-hidden z-3;

  .chat-header {
    --style: w-full h-54px pt-20px pb-10px px-24px flex justify-between items-center;

    .chat-title {
      --style: flex items-center select-none;

      img {
        --style: w-24px h-24px object-contain select-none;
      }

      span {
        --style: ml-8px text-(13px #999) line-height-18px;
      }
    }

    .close {
      --style: 'w-16px h-16px flex-center hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
      img {
        --style: w-full select-none;
      }
    }
  }

  .messages-container {
    --style: relative flex-1 w-full h-full overflow-hidden;
    &::before,
    &::after {
      --style: z-2 content-empty absolute h-10px w-full left-0 from-#262626 to-transprent;
    }

    &::before {
      --style: bottom-0 bg-gradient-to-t;
    }

    &::after {
      --style: top-0 bg-gradient-to-b;
    }

    .messages {
      --style: w-full h-full py-10px overflow-auto;

      .message {
        --style: 'not-first:mt-8px flex items-center px-24px';
      }

      .message:has(.bubble-message) + .message:has(.question-message) {
        --style: '!mt-16px';
      }

      .loading {
        --style: w-full flex-center pt-5 pb-3;
      }
    }
  }

  .bottom-container {
    --style: w-full;
    .quote-container {
      --style: px-24px pt-16px pb-8px flex items-center justify-between border-t-(1px solid #ffffff0f);
      .quote {
        --style: pl-8px border-l-(2px solid #ffffff14) line-clamp-2 text-(15px #ffffff66) break-all;
        i.img {
          --style: w-13px h-13px inline-block bg-contain mr-4px translate-y-2px;
        }

        span {
          --style: line-height-21px overflow-hidden;
        }
      }

      button {
        --style: ml-16px shrink-0 w-16px h-16px bg-contain transition-transform duration-250;
        &:hover {
          --style: scale-105;
        }

        &:active {
          --style: scale-115;
        }
      }
    }

    .input-container {
      --style: w-full p-24px rounded-1 bg-#262626FF overflow-hidden;

      .textarea-wrapper {
        --style: w-full h-full relative border-(2px solid #1f1f1fff) bg-#1f1f1fff rounded-8px py-16px pl-16px pr-64px flex;

        textarea {
          --style: w-full min-h-22px max-h-88px h-22px resize-none text-(15px #ffffffe6) bg-transparent line-height-22px;

          &::placeholder,
          &::-webkit-input-placeholder {
            --style: text-(15px #ffffff66) line-height-21px;
          }
        }

        button {
          --style: absolute right-22px bottom-17px w-20px h-20px bg-contain transition-transform duration-250;

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

.chat-leave-to,
.chat-enter-from {
  --style: 'opacity-0';
}

.chat-enter-active,
.chat-leave-active {
  --style: transition-opacity duration-250 ease-in-out;
}
</style>
