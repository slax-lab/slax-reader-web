<template>
  <!-- 空数据视图：inbox 按扩展安装/订阅状态分 B 列表内安装提示 / C 纯净空态两种，其余 tab 走通用
       BOOKMARK_EMPTY_CONFIG。状态 A（全新用户）由页面层 watch(inboxState) 触发跳转 /onboarding，
       页面层在跳转期间会把传给本组件的 inboxState 映射成 'B'，本组件本身不需要感知 A。
       inboxState 由页面层的 useInboxOnboardingState 统一计算后传入，避免多处各自探测扩展安装状态。 -->
  <BookmarksEmptyView v-if="inboxState === 'B'" :title="promptTitle" :desc="promptDesc" :action-text="promptInstall" :action-note="promptNote" @action="installExtension">
    <template #icon>
      <svg width="32" height="32" :viewBox="emptyIconViewBox" fill="none" stroke="currentColor" stroke-width="1.5" v-html="emptyIconPath" />
    </template>
  </BookmarksEmptyView>
  <BookmarksEmptyView v-else-if="inboxState === 'C' || !isCurrentInboxTab" :title="emptyTitle" :desc="emptyDesc">
    <template #icon>
      <svg width="32" height="32" :viewBox="emptyIconViewBox" fill="none" stroke="currentColor" stroke-width="1.5" v-html="emptyIconPath" />
    </template>
  </BookmarksEmptyView>
</template>

<script setup lang="ts">
import BookmarksEmptyView from '#layers/core/app/components/BookmarkList/BookmarksEmptyView.vue'

import type { InboxOnboardingState } from '#layers/core/app/composables/bookmark/useInboxOnboardingState'
import { BOOKMARK_EMPTY_CONFIG, BOOKMARK_EMPTY_FALLBACK } from '#layers/core/app/constants/bookmarkEmptyConfig'

const props = defineProps<{
  filterStatus: string
  isCurrentInboxTab: boolean
  // inbox 三态判断结果：A 由页面层映射成 'B' 后才传入（跳转 /onboarding 期间的过渡展示）；
  // B/C/null（未就位）本组件按原样处理
  inboxState: InboxOnboardingState
}>()

const { t } = useI18n()

const pluginUrl = 'https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd?utm_source=web_empty_state'
const installExtension = () => window.open(pluginUrl)

const promptTitle = computed(() => t('page.bookmarks_index.empty_inbox_prompt.title'))
const promptDesc = computed(() => t('page.bookmarks_index.empty_inbox_prompt.desc'))
const promptInstall = computed(() => t('page.bookmarks_index.empty_inbox_prompt.install'))
const promptNote = computed(() => t('page.bookmarks_index.empty_inbox_prompt.note'))

// 各 tab 通用空态配置；inbox 状态 B/C 共用其图标，未匹配走兜底
const entry = computed(() => BOOKMARK_EMPTY_CONFIG[props.filterStatus] ?? BOOKMARK_EMPTY_FALLBACK)
const emptyIconPath = computed(() => entry.value.iconPath)
// 优先用 icon 自带 viewBox
const emptyIconViewBox = computed(() => entry.value.iconViewBox ?? '0 0 24 24')
const emptyTitle = computed(() => t(entry.value.titleKey))
const emptyDesc = computed(() => (entry.value.descKey ? t(entry.value.descKey) : ''))
</script>
