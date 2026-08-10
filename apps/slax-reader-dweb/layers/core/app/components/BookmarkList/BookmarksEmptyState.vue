<template>
  <!-- 空数据视图：inbox 在 PC 且非首屏时展示 QuickStart 引导，其余 tab 展示通用空态 -->
  <div class="quick-start-wrap" v-if="isCurrentInboxTab && isPC() && !isFirstLoad">
    <QuickStart />
  </div>
  <BookmarksEmptyView v-else :title="emptyTitle" :desc="emptyDesc">
    <template #icon>
      <svg width="32" height="32" :viewBox="emptyIconViewBox" fill="none" stroke="currentColor" stroke-width="1.5" v-html="emptyIconPath" />
    </template>
  </BookmarksEmptyView>
</template>

<script setup lang="ts">
import BookmarksEmptyView from '#layers/core/app/components/BookmarkList/BookmarksEmptyView.vue'
import QuickStart from '#layers/core/app/components/QuickStart.vue'

import { isPC } from '@commons/utils/is'

import { BOOKMARK_EMPTY_CONFIG, BOOKMARK_EMPTY_FALLBACK } from '#layers/core/app/constants/bookmarkEmptyConfig'

const props = defineProps<{
  filterStatus: string
  isCurrentInboxTab: boolean
  isFirstLoad: boolean
}>()

const { t } = useI18n()

// 当前 tab 空态配置，未匹配走兜底
const entry = computed(() => BOOKMARK_EMPTY_CONFIG[props.filterStatus] ?? BOOKMARK_EMPTY_FALLBACK)
const emptyIconPath = computed(() => entry.value.iconPath)
// 优先用 icon 自带 viewBox
const emptyIconViewBox = computed(() => entry.value.iconViewBox ?? '0 0 24 24')
const emptyTitle = computed(() => t(entry.value.titleKey))
const emptyDesc = computed(() => (entry.value.descKey ? t(entry.value.descKey) : ''))
</script>

<style lang="scss" scoped>
.quick-start-wrap {
  --style: max-w-572px mt-24px mx-auto;
}
</style>
