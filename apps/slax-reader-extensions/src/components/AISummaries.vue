<template>
  <div class="ai-summaries">
    <div class="operate-container">
      <button class="refresh" v-if="done && retryCount > 0" @click="refresh">
        <span>{{ $t('common.operate.summary_refresh') }}</span>
      </button>
      <i class="seperator"></i>
      <button class="close" @click="closeModal">
        <img src="@/assets/button-dialog-close.png" />
      </button>
    </div>
    <div class="summaries-container" v-if="!loading && markdownText.length > 0">
      <div class="header">
        <span class="title">{{ $t('component.ai_summaries.title') }}：</span>
        <div class="switch" v-if="done && summaries.length > 1">
          <button class="left" :class="{ disable: currentSummaryIndex <= 0 }" @click="switchPrevClick">
            <img src="@/assets/button-tiny-right-arrow-outline.png" alt="" />
          </button>
          <span>{{ currentSummaryIndex + 1 }}/{{ summaries.length }}</span>
          <button class="right" :class="{ disable: currentSummaryIndex >= summaries.length - 1 }" @click="switchNextClick">
            <img src="@/assets/button-tiny-right-arrow-outline.png" alt="" />
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
    <div class="empty" v-else-if="!loading && markdownText.length === 0">
      <span>{{ $t('component.ai_summaries.click_to_interpret') }}</span>
      <div class="button" @click="checkAndLoadSummaries()">{{ $t('component.ai_summaries.interpret') }}</div>
    </div>
    <div class="loading" v-else-if="loading">
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
import DotLoading from './DotLoading.vue'
import MarkdownText from './Markdown/MarkdownText.vue'
import MarkMindMap from './Markdown/MarkMindMap.vue'

import { Resize } from '@commons/utils/directive'
import { extractMarkdownFromText } from '@commons/utils/parse'
import { RequestMethodType } from '@commons/utils/request'
import { findMatchingElement, queryAnchorAlikeQuote, queryMarkdownAnchorQuote, querySimularMarkdownAnchorQuote } from '@commons/utils/search'
import { copyText } from '@commons/utils/string'

import Toast, { ToastType } from './Toast'
import { RESTMethodPath } from '@commons/types/const'
import type { SummaryItemModel } from '@commons/types/interface'
import { Readability } from '@slax-lab/readability'

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
  }
})

const emits = defineEmits(['navigatedText', 'dismiss'])
const textContainer = ref<HTMLDivElement>()
const loadingBottom = ref<HTMLDivElement>()
const vResize = Resize
const rawMarkdownText = ref('')
const markdownText = ref('') // markdownText数据默认由rawMarkdownText驱动
const summaries = ref<SummaryItemModel[]>([])
const currentSummaryIndex = ref(0)

const mapHeight = ref<number>()
const markmind = ref<InstanceType<typeof MarkMindMap>>()

const loadingText = $t('component.ai_summaries.processing')
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
  () => props.isAppeared,
  value => {
    if (value && !loading.value && !done.value) {
      checkAndLoadSummaries()
    }
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

const checkAndLoadSummaries = async () => {
  currentSummaryIndex.value = 0
  if (!props.bookmarkId) {
    await loadSummaries()
    return
  }

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
    body:
      props.bookmarkId || props.shareCode || props.collection
        ? {
            bmId: props.bookmarkId ? props.bookmarkId : undefined,
            shareCode: props.shareCode ? props.shareCode : undefined,
            ...(props.collection ? { collectionCode: props.collection?.code, cbId: props.collection?.cbId } : undefined),
            force: refresh
          }
        : {
            raw_content: getRawTextContent()?.textContent || ''
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
  const domElement = document.querySelector(props.contentSelector || 'body') || document.body
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
    if (!(element instanceof HTMLElement)) {
      return false
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
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

    const range = document.createRange()
    startNode && range.setStart(startNode, 0)
    endNode && range.setEnd(endNode, endNode.nodeValue?.length || 0)
    const selection = window.getSelection()
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
    text: $t('component.ai_summaries.copy_content_success'),
    type: ToastType.Success
  })
}
const closeModal = () => {
  emits('dismiss')
}

const getRawTextContent = () => {
  return new Readability(cloneBodyDocument(), { debug: false }).parse()
}

const cloneBodyDocument = () => {
  const newDocument = document.implementation.createHTMLDocument(document.title)
  const bodyContent = document.body.cloneNode(true)
  newDocument.body.parentNode?.replaceChild(bodyContent, newDocument.body)
  return newDocument
}
</script>

<style lang="scss" scoped>
$copyButtonXOffset: 20px;

.ai-summaries {
  --style: min-h-screen relative;

  & > div:not(.operate-container) {
    --style: w-full h-full flex flex-col bg-#262626;
  }

  .operate-container {
    --style: absolute top-24px right-40px flex-center;

    button {
      --style: ' hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
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
      --style: mx-10px w-1px h-10px bg-#333333 invisible;
    }

    button + .seperator {
      --style: visible;
    }
  }

  .summaries-container {
    --style: items-center overflow-y-auto;

    .header {
      --style: w-full p-x-40px pt-24px pb-0 flex items-center;

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
          --style: text-(12px #ffffff66) line-height-16px;
        }
      }
    }

    .content {
      --style: w-full flex-1 box-border;

      & > div {
        --style: w-full overflow-auto;
      }

      .text-content {
        --style: px-40px pt-24px pb-32px relative bg-#262626 rounded-b-4;

        .text-container {
          position: relative;
          height: 0;
          overflow: hidden;

          &::before {
            z-index: 2;
            content: '';
            background: linear-gradient(0deg, #262626, transparent);
            position: absolute;
            bottom: 0;
            height: 20px;
            width: 100%;
            left: 0;
          }
        }

        .loading-bottom {
          position: absolute;
          box-sizing: border-box;
          width: 100%;
          padding-top: 24px + 32px;
          padding-left: 4px + 40px;
          left: 0;
          top: 100%;
          transition: top 0.25s ease-in-out;
        }
      }

      .map-content {
        position: relative;
        box-sizing: border-box;
        padding: 0;
        min-height: 500px;
        background-color: #262626;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .map-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 40px 40px 5px;
          z-index: 1;
          background-color: #262626;
          .title {
            font-family:
              PingFangSC,
              PingFang SC;
            font-weight: 600;
            font-size: 16px;
            color: #ffffffe6;
            line-height: 22px;
          }

          .description {
            margin-top: 4px;
            box-sizing: border-box;
            font-family:
              PingFangSC,
              PingFang SC;
            font-weight: 400;
            font-size: 13px;
            color: #ffffffcc;
            line-height: 20px;
          }

          &::before {
            content: '';
            background: linear-gradient(0deg, transparent, #262626);
            position: absolute;
            bottom: -20px;
            height: 20px;
            width: 100%;
            left: 0;
          }
        }

        // eslint-disable-next-line vue-scoped-css/no-unused-selector
        .mark-mind-map {
          flex: 1;
        }
      }
    }
  }

  .empty {
    --style: '!h-100vh select-none justify-center items-center';

    span {
      --style: font-400 text-(14px #ffffff66) line-height-20px;
      font-family:
        PingFangSC,
        PingFang SC;
    }

    .button {
      --style: mt-24px w-200px h-48px rounded-6 text-(16px #fff) font-600 flex-center cursor-pointer bg-#16b998 transition-colors duration-150;
      margin-top: 24px;
      width: 200px;
      height: 48px;
      border-radius: 24px;
      font-family:
        PingFangSC,
        PingFang SC;
      font-weight: 600;
      font-size: 16px;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: white;
      background-color: #16b998;
      transition: background-color 0.15s ease-in-out;

      &:hover {
        background-color: #16b998aa;
      }
    }
  }
  .loading {
    --style: min-h-screen py-24px px-40px select-none box-border;

    span {
      --style: font-500 text-(14px #16b998) line-height-20px text-align-left;
    }

    .placeholder {
      --style: mt-24px w-full flex flex-col;

      .row {
        --style: 'w-full h-16px rounded-1 not-first:mt-10px';
        background: linear-gradient(90deg, #ffffff33, #ffffff11);
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
