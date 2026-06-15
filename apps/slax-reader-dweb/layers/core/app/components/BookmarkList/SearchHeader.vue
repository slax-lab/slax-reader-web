<template>
  <div class="search-view">
    <!-- 搜索结果头部：返回按钮 + 元信息 -->
    <div class="search-view-header">
      <button class="search-back-btn" @click="navigateBack" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>{{ $t('page.bookmarks_index.search_back') }}</span>
      </button>
      <p class="search-view-meta" v-if="searchResults.length > 0 || (!isSearching && defaultSearchText)">
        {{ $t('component.search_header.found_count', { count: searchResults.length }) }}
        <span class="search-keyword">{{ defaultSearchText }}</span>
      </p>
    </div>

    <!-- 搜索结果列表 -->
    <div class="search-result-list" v-if="searchResults.length > 0">
      <article v-for="result in searchResults" :key="result.bookmark_id" class="search-result-item" @click="navigateToBookmark(result)">
        <h3 class="search-result-title" v-html="result.highlight_title" />
        <p class="search-result-snippet" v-if="result.highlight_content">…<span v-html="result.highlight_content"></span>…</p>
        <div class="search-result-meta" v-if="result.type === 'vector'">
          <span class="search-result-tag">{{ $t('component.search_header.semantic_relative', { value: `${(result.vs_score * 100).toFixed(1)}` }) }}</span>
        </div>
      </article>
    </div>

    <!-- 空态 -->
    <div class="search-empty" v-if="!isSearching && searchResults.length === 0 && defaultSearchText">
      {{ $t('component.search_header.empty') }}
    </div>

    <!-- 加载中 -->
    <div class="search-loading" v-if="isSearching">
      <div class="i-svg-spinners:90-ring" style="color: var(--slax-accent); width: 20px; height: 20px"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import type { SearchResultItem } from '@commons/types/interface'

const props = defineProps({
  defaultSearchText: {
    type: String,
    required: false,
    default: ''
  }
})

const emits = defineEmits(['back', 'searchStatusUpdate'])

const isSearching = ref(false)
const searchResults = ref<SearchResultItem[]>([])

watch(
  () => props.defaultSearchText,
  value => {
    if (value) {
      search(value)
    }
  }
)

watch(
  () => isSearching.value,
  value => {
    emits('searchStatusUpdate', value)
  }
)

onMounted(() => {
  if (props.defaultSearchText) {
    search(props.defaultSearchText)
  }
})

const searchApi = async (text: string) => {
  return await request().post<SearchResultItem[]>({
    url: RESTMethodPath.SEARCH_CONTENT,
    body: { keyword: text }
  })
}

const navigateBack = () => {
  emits('back')
  emits('searchStatusUpdate', false)
}

const navigateToBookmark = (result: SearchResultItem) => {
  // 快照目标由 seam 统一决定（fork 覆盖跳 /b/）；缺标识回退 /bookmarks/[id]
  const target = useBookmarkSnapshotRoute(result) ?? `/bookmarks/${result.bookmark_id}`
  pwaOpen({ url: target })
}

const search = async (text: string) => {
  if (!text) return
  isSearching.value = true
  try {
    const results = await searchApi(text)
    searchResults.value = results || []
  } catch (error) {
    console.error('搜索出错:', error)
  } finally {
    isSearching.value = false
  }
}
</script>

<style lang="scss" scoped>
.search-view {
  padding-bottom: 48px;
}

.search-view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.search-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  cursor: pointer;
  color: var(--slax-text-muted);
  font-family: inherit;
  font-size: 13px;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--slax-surface);
    color: var(--slax-text);
    border-color: color-mix(in srgb, var(--slax-accent) 30%, var(--slax-border));
  }
}

.search-view-meta {
  font-size: 13px;
  color: var(--slax-text-light);
  margin: 0;
}

.search-keyword {
  color: var(--slax-accent);
  font-weight: 500;
  margin-left: 4px;
}

.search-result-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-result-item {
  display: block;
  padding: 16px 18px;
  border-radius: var(--slax-radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--slax-surface);
    border-color: var(--slax-border);
  }
}

.search-result-title {
  font-family: var(--slax-font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--slax-text);
  margin: 0 0 6px;
  line-height: 1.5;

  :deep(mark) {
    background: var(--slax-accent-bg);
    color: var(--slax-accent);
    border-radius: 3px;
    padding: 0 2px;
  }
}

.search-result-snippet {
  font-size: 13px;
  color: var(--slax-text-light);
  line-height: 1.7;
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  :deep(mark) {
    background: var(--slax-accent-bg);
    color: var(--slax-accent);
    border-radius: 3px;
    padding: 0 2px;
  }
}

.search-result-meta {
  margin-top: 4px;
}

.search-result-tag {
  font-size: 11px;
  color: var(--slax-text-light);
  background: var(--slax-accent-bg);
  padding: 2px 8px;
  border-radius: 999px;
}

.search-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--slax-text-light);
  font-size: 13px;
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
</style>
