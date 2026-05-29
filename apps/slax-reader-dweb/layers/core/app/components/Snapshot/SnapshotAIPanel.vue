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
        <MarkdownText class="panel-outline-text" :text="outlineText" />
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

import { RESTMethodPath } from '@commons/types/const'
import type { SummaryItemModel } from '@commons/types/interface'

// 去掉 outline markdown 里的锚点链接，只保留文字
// AISummaries 的锚点格式：[text](anchor_N) 或 [text](#url-encoded)
// SnapshotAIPanel 不做跳转，直接剥掉链接语法避免渲染成无效 <a>
const stripAnchors = (text: string): string => {
  // [text](anchor_N) → text（内部 anchor key）
  // [text](#...) → text（URL 锚点）
  return text.replace(/\[([^\]]+)\]\((anchor_[^)]+|#[^)]*)\)/g, '$1')
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
      outlineText.value = stripAnchors(extractMarkdownFromText(selfSummary.content) || '')
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
      outlineText.value = stripAnchors(extractMarkdownFromText(result) || '')
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
  --style: px-20px py-24px flex flex-col;
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
    --style: relative pl-16px text-(14px txt-muted);
    line-height: 1.6;

    &:not(:last-child) {
      --style: mb-8px;
    }

    &::before {
      --style: content-empty absolute left-0 top-10px w-4px h-4px rounded-full;
      // border / line-height 用原生写法（UnoCSS 的 border-(1.5px ...) 简写会被解析成 1px）
      // 显式 content-box 对齐 demo：项目全局 *{box-sizing:border-box} 会把伪元素也设成 border-box，
      // 导致圆圈外径被压成 4px；demo 是 content-box，外径 = 4px content + 1.5px×2 border = 7px
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
      top: 10px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--slax-text-light);
      box-sizing: content-box;
    }
  }

  // 锚点数字 chip（对齐 demo .num）
  // AISummaries 把锚点转成 [N](anchor_N)，stripAnchors 已去掉链接，
  // 但纯数字文本仍可能出现在 li 末尾；这里不做特殊处理，保持纯文字即可
  :deep(a) {
    // 剩余未被 stripAnchors 处理的链接：去掉下划线，颜色用 accent
    color: var(--slax-accent);
    text-decoration: none;
    pointer-events: none; // 不可点击，避免跳转
  }

  // 段落间距
  :deep(p) {
    margin-bottom: 8px;
    line-height: 1.6;
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
