<template>
  <div class="ai-summaries">
    <div class="dark-trigger" ref="darkTrigger" />
    <div class="operate-container">
      <button class="refresh" v-if="done && retryCount > 0" @click="refresh">
        <span>{{ $t('common.operate.summary_refresh') }}</span>
      </button>
      <template v-if="!closeButtonHidden">
        <i class="seperator"></i>
        <button class="close" @click="closeModal">
          <img v-if="!isDark()" src="@images/button-dialog-close.png" />
          <img v-else src="@images/button-dialog-close-dark.png" />
        </button>
      </template>
    </div>
    <div class="summaries-container bg-container" v-if="!loading && markdownText.length > 0">
      <div class="header">
        <span class="title">{{ $t('component.ai_summaries.title') }}：</span>
        <div class="switch" v-if="done && summaries.length > 1">
          <button class="left" :class="{ disable: currentSummaryIndex <= 0 }" @click="switchPrevClick">
            <img v-if="!isDark()" src="@images/button-tiny-right-arrow-outline.png" alt="" />
            <img v-else src="@images/button-tiny-right-arrow-outline-dark.png" alt="" />
          </button>
          <span>{{ currentSummaryIndex + 1 }}/{{ summaries.length }}</span>
          <button class="right" :class="{ disable: currentSummaryIndex >= summaries.length - 1 }" @click="switchNextClick">
            <img v-if="!isDark()" src="@images/button-tiny-right-arrow-outline.png" alt="" />
            <img v-else src="@images/button-tiny-right-arrow-outline-dark.png" alt="" />
          </button>
        </div>
      </div>
      <div class="content">
        <div class="content-container">
          <div class="text-content">
            <div class="text-container" ref="textContainer">
              <MarkdownText :text="markdownText" @anchor-click="anchorClick" v-resize="resizeHandler" />
            </div>
            <div class="loading-bottom" ref="loadingBottom" v-if="!done">
              <DotLoading />
            </div>
          </div>
          <div class="map-content" v-if="done" :style="{ height: mapHeight ? mapHeight + 'px' : undefined }">
            <div class="map-header">
              <div class="title">{{ $t('component.ai_summaries.mindmap') }}</div>
              <div class="description">{{ $t('component.ai_summaries.click_to_expand') }}</div>
            </div>
            <MarkMindMap
              ref="markmind"
              :data="markdownText"
              :showToolbar="true"
              :hideAnchor="false"
              :defaultExpandLevel="2"
              @graphHeightUpdate="graphHeightUpdate"
              @anchor-click="anchorClick"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="empty bg-container" v-else-if="!loading && markdownText.length === 0">
      <span>{{ $t('component.ai_summaries.click_to_interpret') }}</span>
      <div class="button" @click="checkAndLoadSummaries()">{{ $t('component.ai_summaries.interpret') }}</div>
    </div>
    <div class="loading bg-container" v-else-if="loading">
      <span>{{ loadingTitle }}</span>
      <div class="placeholder">
        <div class="row" v-for="(_, index) in Array.from({ length: 3 })" :key="index"></div>
      </div>
    </div>
    <Transition name="copy">
      <span class="copy-container" v-show="!loading && markdownText.length > 0 && done">
        <CopyButton @click="copyContent" />
      </span>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import CopyButton from './CopyButton.vue'
import MarkdownText from './Markdown/MarkdownText.vue'
import MarkMindMap from './Markdown/MarkMindMap.vue'
import DotLoading from '#layers/core/components/DotLoading.vue'

import { Resize } from '@commons/utils/directive'
import { extractMarkdownFromText } from '@commons/utils/parse'
import { RequestMethodType } from '@commons/utils/request'
import { findMatchingElement, queryAnchorAlikeQuote, queryMarkdownAnchorQuote, querySimularMarkdownAnchorQuote } from '@commons/utils/search'
import { copyText } from '@commons/utils/string'

import Toast, { ToastType } from './Toast'
import { RESTMethodPath } from '@commons/types/const'
import type { SummaryItemModel } from '@commons/types/interface'

interface Anchor {
  index: number
  anchorNum: string
  text: string
  anchorText: string
}

interface AnchorInfo {
  useful: Anchor[]
  useless: Anchor[]
  simular: Anchor[]
}

const props = defineProps({
  bookmarkId: Number,
  shareCode: String,
  collection: {
    type: Object as PropType<{ code: string; cbId: number }>,
    required: false
  },
  contentSelector: {
    required: false,
    type: String
  },
  isAppeared: {
    required: false,
    type: Boolean
  },
  closeButtonHidden: {
    required: false,
    type: Boolean
  }
})

const { t } = useI18n()
const emits = defineEmits(['navigatedText', 'dismiss'])
const darkTrigger = ref<HTMLDivElement>()
const textContainer = ref<HTMLDivElement>()
const loadingBottom = ref<HTMLDivElement>()
const vResize = Resize
const rawMarkdownText = ref('')
const markdownText = ref('') // markdownText数据默认由rawMarkdownText驱动
const summaries = ref<SummaryItemModel[]>([])
const currentSummaryIndex = ref(0)

const mapHeight = ref<number>()
const markmind = ref<InstanceType<typeof MarkMindMap>>()

const loadingText = t('component.ai_summaries.processing')
const loading = ref(false)
const loadingTitle = ref(loadingText)
const loadingInterval = ref<NodeJS.Timeout>()

const retryCount = ref(0)
const done = ref(false)
const anchorRefs: Record<string, string> = {}
const anchorInfo: AnchorInfo = {
  useful: [],
  useless: [],
  simular: []
}

const currentSearchAnchor = {
  text: '',
  index: -1
}

watch(
  () => rawMarkdownText.value,
  value => {
    markdownText.value = handleData(value)
  },
  {
    flush: 'sync'
  }
)

watch(
  () => loading.value,
  (value, oldValue) => {
    if (value === oldValue) {
      return
    }

    if (value) {
      loadingInterval.value = setInterval(() => {
        const ellipses = loadingTitle.value.replace(loadingText, '')
        loadingTitle.value = `${loadingText}${Array.from({ length: (ellipses.length + 1) % 4 })
          .map(() => '.')
          .join('')}`
      }, 500)
    } else {
      loadingTitle.value = loadingText
      clearInterval(loadingInterval.value)
    }
  }
)

const isDark = () => {
  if (!darkTrigger.value) {
    return false
  }

  const style = window.getComputedStyle(darkTrigger.value)
  return style.opacity === '1'
}

const checkAndLoadSummaries = async () => {
  currentSummaryIndex.value = 0

  await getSummariesList()

  if (summaries.value.length > 0) {
    rawMarkdownText.value = summaries.value[0].content
    done.value = true
  } else if (retryCount.value > 0) {
    await loadSummaries()
  }
}

const getSummariesList = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  // 获取当前书签所有总结，同时会将属于自己的总结放在第1位
  const list = await request.get<SummaryItemModel[]>({
    url: RESTMethodPath.BOOKMARK_AI_SUMMARIES_LIST,
    query: {
      ...(props.bookmarkId ? { bookmark_id: props.bookmarkId } : undefined),
      ...(props.shareCode ? { share_code: props.shareCode } : undefined),
      ...(props.collection ? { collection_code: props.collection.code, cb_id: props.collection.cbId } : undefined)
    }
  })

  loading.value = false

  if (list) {
    const selfSummary = list.find(item => item.is_self)
    if (selfSummary) {
      retryCount.value = selfSummary.updated_at ? 0 : 1
      summaries.value = [selfSummary, ...list.filter(item => !item.is_self)]
    } else {
      retryCount.value = 2
      summaries.value = list
    }
  }
}

const querySummaries = async (refresh: boolean, callback: (text: string, done: boolean, error?: Error) => void) => {
  if (loading.value) {
    return
  }

  loading.value = true
  const callBack = await request.stream({
    url: RESTMethodPath.BOOKMARK_AI_SUMMARIES,
    method: RequestMethodType.post,
    body: {
      bm_id: props.bookmarkId ? props.bookmarkId : undefined,
      share_code: props.shareCode ? props.shareCode : undefined,
      ...(props.collection ? { collection_code: props.collection?.code, cb_id: props.collection?.cbId } : undefined),
      force: refresh
    }
  })

  callBack &&
    callBack((text: string, isDone: boolean) => {
      callback(text, isDone)

      loading.value = markdownText.value.length === 0
      if (isDone) {
        done.value = true
        retryCount.value = Math.max(retryCount.value - 1, 0)
        updateSummaryInList()
      }
    })
}

const updateSummaryInList = () => {
  const needInsert = summaries.value.length === 0 || !summaries.value[0].is_self
  if (!needInsert) {
    // 不需要插入的话，那第一条一定会是用户自己的总结
    summaries.value[0].content = rawMarkdownText.value
  } else {
    summaries.value.unshift({
      content: rawMarkdownText.value,
      updated_at: new Date(),
      is_self: true
    })
  }
}

const switchPrevClick = () => {
  if (currentSummaryIndex.value <= 0) {
    return
  }

  currentSummaryIndex.value = Math.max(currentSummaryIndex.value - 1, 0)
  rawMarkdownText.value = summaries.value[currentSummaryIndex.value].content
}

const switchNextClick = () => {
  if (currentSummaryIndex.value >= summaries.value.length - 1) {
    return
  }

  currentSummaryIndex.value = Math.min(currentSummaryIndex.value + 1, summaries.value.length - 1)
  rawMarkdownText.value = summaries.value[currentSummaryIndex.value].content
}

const handleData = (text: string) => {
  const usefulAnchors: Anchor[] = []
  const uselessAnchors: Anchor[] = []
  const simularAnchor: Anchor[] = []

  // 这个是完整格式的锚点
  const anchors = queryMarkdownAnchorQuote(text)
  const anchorIndexs = anchors.map(anchor => anchor.index)

  anchors.forEach(anchor => {
    const key = `anchor_${anchor.anchorNum}`

    if (!anchor.text || !findTextInWeb(anchor.text, false)) {
      text = text.replaceAll(anchor.anchorText, ``)
      uselessAnchors.push(anchor)
      return
    }

    anchorRefs[key] = anchor.text
    text = text.replaceAll(anchor.anchorText, ` [${decodeURIComponent(anchor.anchorNum)}](${key})`)
    usefulAnchors.push(anchor)
  })

  // 这个是不完整的锚点
  const simAnchors = querySimularMarkdownAnchorQuote(text).filter(anchor => {
    return !anchorIndexs.includes(anchor.index)
  })

  simAnchors.forEach(anchor => {
    const key = `anchor_000`
    text = text.replaceAll(anchor.anchorText, !loading.value ? ` [${decodeURIComponent(anchor.anchorNum)}](${key})` : ``)
    simularAnchor.push(anchor)
  })

  anchorInfo.useful = usefulAnchors
  anchorInfo.useless = uselessAnchors
  anchorInfo.simular = simularAnchor

  return text
}

const findTextInWeb = (text: string, autoNavigate: boolean = true) => {
  let domElement = document.querySelector(props.contentSelector || '') || document.body
  let contentDocument = document
  let contentWindow = window

  if (domElement instanceof HTMLIFrameElement) {
    const iframeDocument = domElement.contentDocument
    const iframeWindow = domElement.contentWindow
    if (iframeDocument && iframeWindow) {
      contentWindow = iframeWindow as Window & typeof globalThis
      contentDocument = iframeDocument
      domElement = iframeDocument.body
    }
  }

  const elements = findMatchingElement(text, domElement)
  if (elements.length === 0) {
    text = text.replaceAll('-', ' ')

    const simularElements = findMatchingElement(text, domElement)
    elements.push(...simularElements)

    if (elements.length === 0) {
      return false
    }
  }

  if (autoNavigate) {
    if (currentSearchAnchor.text === text) {
      currentSearchAnchor.index = (currentSearchAnchor.index + 1) % elements.length
    } else {
      currentSearchAnchor.text = text
      currentSearchAnchor.index = 0
    }

    if (elements.length < currentSearchAnchor.index) {
      return false
    }

    const element = elements[currentSearchAnchor.index]
    if (!(element instanceof contentWindow.HTMLElement)) {
      return false
    }

    const walker = contentDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
    let currentNode
    const nodes: Node[] = []
    while ((currentNode = walker.nextNode())) {
      if (!currentNode) {
        continue
      }

      nodes.push(currentNode)
    }

    const combineText = nodes.map(node => node.nodeValue).join('')
    const matchedIndex = combineText.indexOf(text)

    let start = 0
    let end = 0
    const startNode = nodes.find(node => {
      if (matchedIndex >= start && matchedIndex < start + (node.nodeValue || '').length) {
        return true
      } else {
        start += (node.nodeValue || '').length
      }
    })

    const endNode = nodes.find(node => {
      if (matchedIndex + text.length > end && matchedIndex + text.length <= end + (node.nodeValue || '').length) {
        return true
      } else {
        end += (node.nodeValue || '').length
      }
    })

    if (!startNode || !endNode) {
      return true
    }

    const range = contentDocument.createRange()
    startNode && range.setStart(startNode, 0)
    endNode && range.setEnd(endNode, endNode.nodeValue?.length || 0)
    const selection = contentWindow.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    const startIndex = nodes.indexOf(startNode)
    const endIndex = nodes.indexOf(endNode)

    let scrollToElement = element
    for (let i = startIndex; i <= endIndex; i++) {
      const node = nodes[i]
      const parentElement = node.parentElement
      if (!parentElement) {
        continue
      }

      if (parentElement !== scrollToElement) {
        scrollToElement = parentElement
        break
      }
    }

    scrollToElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    emits('navigatedText', text)
  }

  return true
}

const refresh = async () => {
  // 重置部分记录的状态
  currentSummaryIndex.value = 0
  rawMarkdownText.value = ''
  loading.value = false
  done.value = false

  loadSummaries({
    refresh: true
  })
}

const loadSummaries = (options?: { refresh: boolean }) => {
  if (props.bookmarkId || props.shareCode || props.collection) {
    let step = 0
    const timeInterval = setInterval(() => {
      step += 1
    }, 2000)

    let executeStep = 0
    let result = ''
    querySummaries(options?.refresh || false, (text: string, done: boolean) => {
      result += text

      let needUpdateText = done || executeStep < step
      if (done) {
        clearInterval(timeInterval)
      } else if (executeStep < step) {
        executeStep = step
      }

      if (needUpdateText) {
        rawMarkdownText.value = extractMarkdownFromText(result) || ''
      }
    })
  }
}

const anchorClick = async (link: string) => {
  findTextInWeb(anchorRefs[link])
}

const resizeHandler = (_: HTMLDivElement, size: DOMRectReadOnly) => {
  const view = textContainer.value
  if (!view || !(view instanceof HTMLElement)) {
    return
  }

  view.style.height = `${size.height + 20}px`
  view.style.transition = `height ${done.value ? 0 : 0.25}s ease-in-out`

  const loadingEle = loadingBottom.value
  if (!loadingEle || !size || !(loadingEle instanceof HTMLElement)) {
    return
  }

  loadingEle.style.top = `${size.height}px`
}

const graphHeightUpdate = (options: { height: number }) => {
  mapHeight.value = options.height + 80 * 2
  nextTick(() => {
    markmind.value?.fitMap()
  })
}

const copyContent = async () => {
  let text = markdownText.value
  // 此处处理数据与content_scripts处处理数据稍有不同，此处传入的text数据已经是content_scripts处处理好了的，因此在text内容的替换处理上会和content_scripts稍有不同
  const { useful, simular } = anchorInfo

  useful.forEach(anchor => {
    const key = `anchor_${anchor.anchorNum}`
    console.log(`替换有效锚点`, `[${anchor.anchorNum}](${key})`)
    text = text.replaceAll(`[${anchor.anchorNum}](${key})`, ``)
  })

  simular.forEach(anchor => {
    const key = `anchor_000`
    console.log(`替换无效锚点`, `[${anchor.anchorNum}](${key})`)
    text = text.replaceAll(`[${anchor.anchorNum}](${key})`, ``)
  })

  // 这个是文本结尾中，带[开头的数据
  const alikeAnchors = queryAnchorAlikeQuote(text)
  alikeAnchors.forEach(anchor => {
    text = text.replaceAll(anchor.text, ``)
  })

  console.log('处理后文本', text)

  const processedText = text
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
    text: t('component.ai_summaries.copy_content_success'),
    type: ToastType.Success
  })
}
const closeModal = () => {
  emits('dismiss')
}

watch(
  () => props.isAppeared,
  value => {
    if (value && !loading.value && !done.value && markdownText.value.length === 0) {
      checkAndLoadSummaries()
    }
  },
  {
    flush: 'sync',
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
$copyButtonXOffset: 20px;

.ai-summaries {
  --style: min-h-screen relative;

  .dark-trigger {
    --style: 'absolute left-0 top-0 w-0 h-0 opacity-0 dark:opacity-100';
  }

  .bg-container {
    --style: w-full h-full flex flex-col rounded-4;
    --style: 'bg-#fcfcfc dark:bg-#262626';
  }

  .operate-container {
    --style: z-1 absolute top-20px right-20px flex-center;

    button {
      --style: 'hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
    }

    .close {
      --style: w-16px h-16px flex-center;
      img {
        --style: w-full select-none;
      }
    }

    .refresh {
      --style: flex-center;
      span {
        --style: text-(13px #999) line-height-18px;
      }
    }

    .seperator {
      --style: mx-10px w-1px h-10px invisible;
      --style: 'bg-#D6D6D6 dark:bg-#333';
    }

    button + .seperator {
      --style: visible;
    }
  }

  .summaries-container {
    --style: items-center overflow-y-auto;
    --style: 'bg-#f5f5f3 dark:bg-transparent';

    .header {
      --style: relative w-full pt-20px px-20px flex items-center;
      --style: 'bg-#fcfcfc dark:(bg-transparent pb-25px)';

      &:before,
      &:after {
        --style: content-empty absolute left-20px right-20px h-1px bg-#FFFFFF0F;
        --style: 'bg-transparent dark:bg-#FFFFFF0F';
      }

      &:before {
        --style: bottom-0;
      }

      &:after {
        --style: bottom-2px;
      }

      .title {
        --style: text-(14px #16b998) font-500 line-height-20px text-align-left;
      }

      .switch {
        --style: ml-8px flex-center;
        & > * {
          --style: 'not-first:ml-1px';
        }

        button {
          --style: w-11px h-10px flex-center rounded-full transition-transform duration-250;

          &:hover {
            --style: scale-105;
          }

          &.disable {
            --style: cursor-auto opacity-50;
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

        span {
          --style: text-12px line-height-16px;
          --style: 'text-#333 dark:text-#ffffff66';
        }
      }
    }

    .content {
      --style: w-full flex-1;

      & > div {
        --style: w-full overflow-auto;
      }

      .text-content {
        --style: px-20px pt-24px pb-32px relative rounded-b-4;
        --style: 'bg-#fcfcfc dark:bg-#262626';

        .text-container {
          --style: relative h-0 overflow-hidden;

          &::before {
            --style: z-2 content-empty bg-gradient-to-t to-transparent absolute left-0 bottom-0 w-full h-20px;
            --style: 'from-#fcfcfc dark:from-#262626';
          }
        }

        .loading-bottom {
          --style: 'absolute left-0 top-full left-0 pt-[calc(24px+32px)] pl-[calc(4px+20px)] transition-top duration-250';
        }
      }

      .map-content {
        --style: relative p-0 min-h-500px flex flex-col justify-between;
        --style: 'bg-#f5f5f3 dark:bg-#262626';

        .map-header {
          --style: absolute top-0 left-0 w-full pt-40px pb-5px px-20px z-1;
          --style: 'bg-#f5f5f3 dark:bg-#262626';

          .title {
            --style: font-600 text-16px line-height-22px;
            --style: 'text-#0f1419 dark:text-#ffffffe6';
          }

          .description {
            --style: mt-4px font-400 text-13px line-height-20px;
            --style: 'text-#808080 dark:text-#ffffffcc';
          }
        }

        // eslint-disable-next-line vue-scoped-css/no-unused-selector
        .mark-mind-map {
          --style: flex-1;
        }
      }
    }
  }

  .empty {
    --style: h-100vh select-none justify-center items-center;

    span {
      --style: font-400 text-14px line-height-20px;
      --style: 'text-#999999 dark:text-#ffffff66';
    }

    .button {
      --style: mt-24px w-200px h-48px rounded-24px text-(16px #fff) font-600 flex-center cursor-pointer bg-#16b998 transition-colors duration-150;

      &:hover {
        --style: bg-#16b998aa;
      }
    }
  }
  .loading {
    --style: min-h-screen py-24px px-20px select-none;

    span {
      --style: font-500 text-(14px #16b998) line-height-20px text-align-left;
    }

    .placeholder {
      --style: mt-24px w-full flex flex-col;

      .row {
        --style: w-full h-16px rounded-1 animate-pulse;
        --style: 'not-first:mt-10px bg-gradient-to-r from-#f5f5f3 to-#f5f5f399 dark:(from-#ffffff33 to-#ffffff11)';
      }
    }
  }
}

.copy-container {
  --style: absolute bottom-38px z-5;
  right: $copyButtonXOffset;
}
.copy-leave-to,
.copy-enter-from {
  transform: translateX(calc(100% + $copyButtonXOffset));
  opacity: 0.2;
}

.copy-leave-from,
.copy-enter-to {
  transform: translateX(0%);
  opacity: 1;
}

.copy-enter-active {
  transition:
    transform 0.4s ease-in-out,
    opacity 0.2s ease-in-out 0.2s;
}

.copy-leave-active {
  transition:
    transform 0.4s ease-in-out,
    opacity 0.2s ease-in-out;
}
</style>
