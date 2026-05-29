<template>
  <div class="snapshot-ai-panel">
    <!-- 全文概要区域 -->
    <section class="panel-overview">
      <div class="panel-overview-label">{{ $t('component.ai_panel.overview_label') }}</div>

      <!-- 加载骨架（首次加载、尚无内容时） -->
      <div class="overview-skeleton" v-if="overviewLoading && overviewContent.length === 0">
        <div class="skeleton-row" v-for="(_, index) in Array.from({ length: 3 })" :key="index"></div>
      </div>

      <!-- 概要内容 -->
      <template v-else-if="overviewContent.length > 0">
        <div class="panel-overview-text">{{ overviewContent }}</div>
        <div class="overview-loading-bottom" v-if="overviewLoading">
          <DotLoading />
        </div>
        <ul class="panel-keypoints" v-if="keyTakeaways.length > 0">
          <li v-for="(item, index) in keyTakeaways" :key="index">{{ item }}</li>
        </ul>
      </template>

      <!-- 加载失败重试 -->
      <div class="overview-retry" v-else-if="overviewError">
        <button class="retry-btn" @click="loadOverview()">{{ $t('component.ai_panel.retry') }}</button>
      </div>
    </section>

    <div class="panel-divider"></div>

    <!-- 全文解析区域 -->
    <section class="panel-outline">
      <!-- 标题带 grid icon，对齐 demo 的 .panel-action 样式 -->
      <div class="panel-outline-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
        {{ $t('component.ai_panel.outline_label') }}
      </div>

      <!-- 加载骨架（首次加载、尚无内容时） -->
      <div class="outline-skeleton" v-if="outlineLoading && outlineText.length === 0">
        <div class="skeleton-row" v-for="(_, index) in Array.from({ length: 3 })" :key="index"></div>
      </div>

      <!-- 大纲内容 -->
      <template v-else-if="outlineText.length > 0">
        <MarkdownText class="panel-outline-text" :text="outlineText" @anchor-click="handleAnchorClick" />
        <div class="outline-loading-bottom" v-if="outlineLoading">
          <DotLoading />
        </div>
      </template>

      <!-- 加载失败重试 -->
      <div class="outline-retry" v-else-if="outlineError">
        <button class="retry-btn" @click="loadOutline()">{{ $t('component.ai_panel.retry') }}</button>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import DotLoading from '#layers/core/app/components/DotLoading.vue'
import MarkdownText from '#layers/core/app/components/Markdown/MarkdownText.vue'

import { extractMarkdownFromText } from '@commons/utils/parse'
import { RequestMethodType } from '@commons/utils/request'
import { findMatchingElement, queryMarkdownAnchorQuote, querySimularMarkdownAnchorQuote } from '@commons/utils/search'

import { RESTMethodPath } from '@commons/types/const'
import type { SummaryItemModel } from '@commons/types/interface'

// 处理 outline markdown 里的锚点（对齐 AISummaries.handleData 逻辑）：
// - anchor_N 格式：保留为 [text](anchor_N)，MarkdownText 会转成可点击的 .slax_link
// - #url 格式（URL 锚点）：去掉链接只保留文字，这类锚点跳不到正文
// 同时维护 anchorRefs 映射，供 anchorClick 跳转使用
const anchorRefs: Record<string, string> = {}

const processOutlineAnchors = (text: string): string => {
  // 完整格式锚点：[text](anchor_N)
  const anchors = queryMarkdownAnchorQuote(text)
  const anchorIndexes = anchors.map(a => a.index)
  anchors.forEach(anchor => {
    const key = `anchor_${anchor.anchorNum}`
    anchorRefs[key] = anchor.text
    text = text.replaceAll(anchor.anchorText, ` [${decodeURIComponent(anchor.anchorNum)}](${key})`)
  })
  // 不完整格式锚点（#url）：去掉链接只保留文字
  const simAnchors = querySimularMarkdownAnchorQuote(text).filter(a => !anchorIndexes.includes(a.index))
  simAnchors.forEach(anchor => {
    text = text.replaceAll(anchor.anchorText, ` ${decodeURIComponent(anchor.anchorNum)}`)
  })
  return text
}

const handleAnchorClick = (link: string) => {
  const refText = anchorRefs[link]
  if (!refText) return
  // 在详情页正文区域查找并滚动到对应文本，滚动后高亮闪烁
  const contentEl = document.querySelector('.bookmark-detail .detail') || document.body
  const result = findMatchingElement(refText, contentEl)
  if (result?.element) {
    result.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 高亮闪烁：复用 hl-flash 动画类（BookmarkArticle 定义在 slax-mark 上，
    // 这里给普通元素加 anchor-flash 类，由本组件的 :global keyframes 驱动）
    const el = result.element
    el.classList.remove('anchor-flash')
    void el.offsetWidth // 强制 reflow，确保 animation 重新触发
    el.classList.add('anchor-flash')
    setTimeout(() => el.classList.remove('anchor-flash'), 3000)
  }
}

const props = defineProps({
  bookmarkId: {
    type: Number,
    required: false
  },
  shareCode: {
    type: String,
    required: false
  },
  isAppeared: {
    type: Boolean,
    required: false,
    default: false
  }
})

defineEmits(['dismiss'])

// ── overview 状态 ──
const overviewContent = ref('')
const keyTakeaways = ref<string[]>([])
const overviewLoading = ref(false)
const overviewError = ref(false)
const overviewDone = ref(false)
const overviewReconnected = ref(false)

// ── outline 状态 ──
const outlineText = ref('')
const outlineLoading = ref(false)
const outlineError = ref(false)
const outlineDone = ref(false)

// ── overview 流式 JSON 帧类型（内联自 AIOverview.vue）──
type OverviewSocketData =
  | {
      type: 'progress' | 'done'
      data: {
        overview?: string
        key_takeaways?: string[]
        tags?: { id: number; name: string }[]
        tag?: { id: number; name: string }
        done?: boolean
        id?: number
      }
    }
  | {
      type: 'error'
      message: string
    }

// 解析后端拼接的多段 JSON（内联自 AIOverview.vue 的 parseConcatenatedJson）
const parseConcatenatedJson = (inputString: string): OverviewSocketData[] => {
  const trimmedString = inputString.trim()
  if (!trimmedString) {
    return []
  }

  const parts = trimmedString.split('}\n{')
  const fixedParts = parts.map((part, index) => {
    if (index === 0 && parts.length > 1) {
      return part + '}'
    } else if (index === parts.length - 1 && parts.length > 1) {
      return '{' + part
    } else if (parts.length > 1) {
      return '{' + part + '}'
    }

    return part
  })

  return fixedParts.map(str => JSON.parse(str)) as OverviewSocketData[]
}

// overview 加载完成后的收尾：内容为空则自动重试一次，再为空则报错
const settleOverviewAfterDone = () => {
  overviewLoading.value = false
  overviewDone.value = true

  if (overviewContent.value.length === 0) {
    if (!overviewReconnected.value) {
      overviewReconnected.value = true
      overviewDone.value = false
      loadOverview()
    } else {
      overviewError.value = true
    }
  }
}

const loadOverview = async () => {
  if (overviewLoading.value) {
    return
  }

  overviewLoading.value = true
  overviewError.value = false

  try {
    const callBack = await request().stream({
      url: RESTMethodPath.BOOKMARK_OVERVIEW,
      method: RequestMethodType.post,
      body: {
        ...(props.bookmarkId ? { bookmark_id: props.bookmarkId } : undefined),
        ...(props.shareCode ? { share_code: props.shareCode } : undefined),
        force: false
      }
    })

    if (!callBack) {
      overviewLoading.value = false
      overviewError.value = true
      return
    }

    let errorCacheText = ''

    callBack((text: string, isDone: boolean) => {
      // 空文本 + done：done 帧，无新内容
      if (text.length === 0 && isDone) {
        settleOverviewAfterDone()
        return
      }

      let parsedJsons: OverviewSocketData[] = []
      try {
        parsedJsons = parseConcatenatedJson(errorCacheText + text)
        errorCacheText = ''
      } catch {
        // JSON 跨块未闭合，缓存等待下一块拼接
        errorCacheText = text
        if (isDone) {
          settleOverviewAfterDone()
        }
        return
      }

      for (const res of parsedJsons) {
        if (res.type === 'error') {
          // error 帧按 done + 空内容处理，触发自动重试
          settleOverviewAfterDone()
          return
        } else if (res.type === 'done' || 'done' in res.data) {
          settleOverviewAfterDone()
          return
        } else if (res.data.overview !== undefined) {
          // overview 覆盖最新值（非追加）
          overviewContent.value = res.data.overview
          overviewLoading.value = false
        } else if (res.data.key_takeaways) {
          keyTakeaways.value = res.data.key_takeaways
        }
        // tags / tag 帧忽略
      }

      if (isDone) {
        settleOverviewAfterDone()
      }
    })
  } catch {
    overviewLoading.value = false
    overviewError.value = true
  }
}

const loadOutline = async () => {
  if (outlineLoading.value) {
    return
  }

  outlineLoading.value = true
  outlineError.value = false

  try {
    // 先 GET 列表，有缓存直接展示
    const list = await request().get<SummaryItemModel[]>({
      url: RESTMethodPath.BOOKMARK_AI_SUMMARIES_LIST,
      query: {
        ...(props.bookmarkId ? { bookmark_id: props.bookmarkId } : undefined),
        ...(props.shareCode ? { share_code: props.shareCode } : undefined)
      }
    })

    if (list && list.length > 0) {
      const selfSummary = list.find(item => item.is_self) ?? list[0]!
      outlineText.value = processOutlineAnchors(extractMarkdownFromText(selfSummary.content) || '')
      outlineLoading.value = false
      outlineDone.value = true
      return
    }

    // 无缓存，POST 流式生成
    const callBack = await request().stream({
      url: RESTMethodPath.BOOKMARK_AI_SUMMARIES,
      method: RequestMethodType.post,
      body: {
        ...(props.bookmarkId ? { bm_id: props.bookmarkId } : undefined),
        ...(props.shareCode ? { share_code: props.shareCode } : undefined),
        force: false
      }
    })

    if (!callBack) {
      outlineLoading.value = false
      outlineError.value = true
      return
    }

    let result = ''
    callBack((text: string, isDone: boolean) => {
      result += text
      outlineText.value = processOutlineAnchors(extractMarkdownFromText(result) || '')
      outlineLoading.value = outlineText.value.length === 0
      if (isDone) {
        outlineLoading.value = false
        outlineDone.value = true
        if (outlineText.value.length === 0) {
          outlineError.value = true
        }
      }
    })
  } catch {
    outlineLoading.value = false
    outlineError.value = true
  }
}

// isAppeared 变为 true 时，overview 与 outline 并发自动加载（互不阻塞）
watch(
  () => props.isAppeared,
  value => {
    if (!value) {
      return
    }

    if (!overviewDone.value && !overviewLoading.value) {
      loadOverview()
    }

    if (!outlineDone.value && !outlineLoading.value) {
      loadOutline()
    }
  },
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.snapshot-ai-panel {
  --style: px-24px py-24px flex flex-col;
}

.panel-overview-label {
  --style: text-(13px accent) font-500 mb-10px;
}

// 全文解析标题：flex 行，带 grid icon，对齐 demo .panel-action
.panel-outline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  font-size: 13px;
  color: var(--slax-accent);
  font-weight: 500;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

.panel-overview-text {
  // 纯文本展示，对齐 snapshot demo 的 .panel-summary；pre-line 保留后端文本里的换行
  // 显式 font-sans，避免继承详情页标题的 serif 字体
  // line-height 用原生 CSS 倍数写法（UnoCSS attrify 的 leading-1.8 会被误解析成极小值）
  --style: font-sans text-(14px txt) mb-24px whitespace-pre-line;
  line-height: 1.8;
}

.panel-keypoints {
  --style: font-sans list-none p-0 mb-28px;

  li {
    // flex 布局让 ::before 圆点自动对齐第一行中心，不依赖硬编码 top 值
    display: flex;
    align-items: flex-start;
    font-size: 14px;
    color: var(--slax-text-muted);
    line-height: 1.6;

    &:not(:last-child) {
      --style: mb-8px;
    }

    &::before {
      content: '';
      flex-shrink: 0;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      // margin-top 让圆点垂直居中于第一行：(line-height * font-size - 圆点直径) / 2
      margin-top: calc((1em * 1.6 - 4px) / 2);
      margin-right: 12px;
      box-sizing: content-box;
      border: 1.5px solid var(--slax-accent);
      background: transparent;
    }
  }
}

.panel-divider {
  --style: h-1px bg-border mt-12px mb-24px;
}

// MarkdownText 渲染的 outline 内容样式
// 对齐 demo 的 panel-section-title / panel-outline-item / panel-outline-sub
.panel-outline-text {
  --style: text-(14px txt);
  line-height: 1.6;

  // h1/h2 → 章节标题（Playfair serif，对齐 demo .panel-section-title）
  :deep(h1),
  :deep(h2) {
    font-family: var(--slax-font-serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--slax-text);
    margin: 16px 0 12px;
    line-height: 1.4;
  }

  // h3 → 子章节标题（sans，稍小）
  :deep(h3) {
    font-size: 14px;
    font-weight: 500;
    color: var(--slax-text);
    margin: 10px 0 6px;
    line-height: 1.5;
  }

  // 顶层列表项（对齐 demo .panel-outline-item）
  :deep(ul) {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  :deep(li) {
    font-size: 14px;
    color: var(--slax-text);
    line-height: 1.6;
    margin-bottom: 8px;
    padding-left: 0;
  }

  // 嵌套列表（对齐 demo .panel-outline-sub）
  :deep(ul ul) {
    margin-top: 4px;
    padding-left: 16px;
  }

  :deep(ul ul li) {
    position: relative;
    color: var(--slax-text-muted);
    margin-bottom: 4px;

    &::before {
      content: '';
      position: absolute;
      left: -12px;
      // top: 0.8em = line-height(1.6) / 2 * font-size，减去圆点半径 2px，自动跟随字号
      top: calc(0.8em - 2px);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--slax-text-light);
      box-sizing: content-box;
    }
  }

  // 锚点 chip 样式（对齐 demo .panel-outline-item .num）
  // MarkdownText 自身有更具体的 .slax_link 样式（bg-#16b9981f text-txt py-3px h-16px align-middle），
  // 用 !important 全量覆盖
  :deep(.slax_link) {
    display: inline-block !important;
    min-width: 20px;
    font-size: 12px !important;
    color: var(--slax-accent) !important;
    background: var(--slax-accent-bg) !important;
    padding: 1px 5px !important;
    border-radius: 3px !important;
    margin-left: 6px;
    text-decoration: none !important;
    text-align: center;
    cursor: pointer;
    // 显式锁定字体，避免继承父元素（如 h1/h2 的 Playfair serif）影响 chip 外观
    font-family: var(--slax-font-sans) !important;
    font-weight: 400 !important;
    font-style: normal !important;
    height: auto !important;
    line-height: 1.6 !important;
    vertical-align: baseline !important;

    &:hover {
      background: var(--slax-accent-bg) !important;
      color: var(--slax-accent) !important;
      opacity: 0.8;
    }
  }

  // li 内第一个子元素不加 margin-top，避免圆点标记与内容垂直错位
  :deep(li > *:first-child) {
    margin-top: 0;
  }

  // 段落间距
  :deep(p) {
    margin-bottom: 8px;
    line-height: 1.6;
  }
}

// anchor-flash：锚点点击后正文元素的高亮动画
// 用 :global 因为 anchor-flash 类加在正文 DOM 上（组件外部）
:global(.anchor-flash) {
  animation: anchor-flash 3s ease-out;
}

@keyframes anchor-flash {
  0% {
    background-color: color-mix(in srgb, var(--slax-accent) 22%, transparent);
    border-radius: 4px;
  }
  100% {
    background-color: transparent;
  }
}

.skeleton-row {
  --style: 'h-16px rounded-1 animate-pulse not-first:mt-10px bg-gradient-to-r from-#f5f5f3 to-#f5f5f399 dark:(from-#ffffff33 to-#ffffff11)';
}

.overview-loading-bottom,
.outline-loading-bottom {
  --style: mt-12px;
}

.overview-retry,
.outline-retry {
  --style: py-8px;

  .retry-btn {
    --style: text-(14px accent) cursor-pointer transition-opacity duration-fast;

    &:hover {
      --style: opacity-80;
    }
  }
}
</style>
