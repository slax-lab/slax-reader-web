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
      <div class="panel-outline-header">{{ $t('component.ai_panel.outline_label') }}</div>

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
      outlineText.value = extractMarkdownFromText(selfSummary.content) || ''
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
      outlineText.value = extractMarkdownFromText(result) || ''
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

.panel-overview-label,
.panel-outline-header {
  --style: text-(13px accent) font-500 mb-10px;
}

.panel-overview-text {
  // 纯文本展示，对齐 snapshot demo 的 .panel-summary；pre-line 保留后端文本里的换行
  // 显式 font-sans，避免继承详情页标题的 serif 字体
  --style: font-sans text-(14px txt) leading-1.8 mb-24px whitespace-pre-line;
}

.panel-keypoints {
  --style: font-sans list-none p-0 mb-28px;

  li {
    --style: relative pl-16px text-(14px txt-muted) leading-1.6;

    &:not(:last-child) {
      --style: mb-8px;
    }

    &::before {
      --style: content-empty absolute left-0 top-10px w-4px h-4px rounded-full border-(1.5px solid accent) bg-transparent;
    }
  }
}

.panel-divider {
  --style: h-1px bg-border mt-12px mb-24px;
}

.panel-outline-text {
  --style: text-(14px txt) leading-1.6;
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
