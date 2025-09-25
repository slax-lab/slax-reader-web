<template>
  <div class="search-header">
    <div class="search-navigator">
      <button class="bg-[length:16px_16px] bg-[url('@images/button-navigate-back.png')] bg-center" @click="navigateBack"></button>
      <span>{{ $t('component.search_header.back') }}</span>
    </div>
    <div class="search-bar">
      <div class="search-input">
        <InputBar
          v-model:text="searchText"
          :confirm-title="$t('common.operate.search')"
          :confirm-icon="InputConfirmIcon.Search"
          :placeholder="$t('component.search_header.placeholder')"
          :loading="isSearching"
          :disabled="searchText.length === 0"
          @confirm="search"
        />
      </div>
    </div>
    <div class="search-list" v-if="searchResults.length > 0">
      <div v-for="result in searchResults" :key="result.bookmark_id" class="search-cell">
        <div class="search-cell-header">
          <div class="cell-header-title" v-html="result.highlight_title" @click="navigateToBookmark(result.bookmark_id)" />
          <!-- AI标识 -->
          <div class="cell-header-ai-tag">
            <span v-if="result.type === 'vector'">{{ $t('component.search_header.semantic_relative', { value: `${(result.vs_score * 100).toFixed(1)}` }) }}</span>
          </div>
        </div>
        <div class="search-cell-content">…<span v-html="result.highlight_content"></span>…</div>
      </div>
    </div>
    <div class="no-data" v-if="!isSearching && searchResults.length === 0">
      <div class="empty">
        <div class="icon"></div>
        <span>{{ $t('component.search_header.empty') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import InputBar, { InputConfirmIcon } from '#layers/core/components/InputBar.vue'

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
const searchText = ref(props.defaultSearchText)
const searchResults = ref<SearchResultItem[]>([])

watch(
  () => props.defaultSearchText,
  value => {
    if (searchText.value !== value) {
      searchText.value = value
      search()
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
  search()
})

const searchApi = async (text: string) => {
  return await request().post<SearchResultItem[]>({
    url: RESTMethodPath.SEARCH_CONTENT,
    body: {
      keyword: text
    }
  })
}

const navigateBack = () => {
  emits('back')
  emits('searchStatusUpdate', false)
}

const navigateToBookmark = (bookmarkId: number) => {
  pwaOpen({
    url: `/bookmarks/${bookmarkId}`
  })
}

const search = async () => {
  if (!searchText.value) {
    return
  }

  isSearching.value = true

  try {
    const results = await searchApi(searchText.value)
    searchResults.value = results || []
  } catch (error) {
    console.error('搜索出错:', error)
  } finally {
    isSearching.value = false
  }
}
</script>

<style lang="scss" scoped>
.search-header {
  --style: pl-24px;

  .search-navigator {
    --style: flex items-center py-24px;

    button {
      --style: w-16px h-16px;
    }

    span {
      --style: ml-14px text-(#333 16px) line-height-20px font-500;
    }
  }

  .search-bar {
    --style: mt-2px pl-14px pr-38px;
  }

  .search-list {
    --style: mt-24px pl-30px pr-38px pb-50px select-none;
    .search-cell {
      --style: 'not-first:(mt-12px)';

      :deep(mark) {
        --style: bg-transparent text-#16b998;
      }

      .search-cell-header {
        --style: flex items-center justify-between;

        .cell-header-title {
          --style: relative text-(14px #0f1419 ellipsis) line-height-22px overflow-hidden whitespace-nowrap cursor-pointer;
        }

        .cell-header-ai-tag {
          --style: text-(12px #999) line-height-17px whitespace-nowrap shrink-0 ml-30px;
        }
      }

      .search-cell-content {
        --style: 'relative mt-2px text-(14px #999) line-height-22px overflow-hidden max-md:(text-ellipsis whitespace-nowrap)';
      }
    }
  }

  .no-data {
    --style: pb-52px text-(12px #999999) select-none relative shrink-0 select-none;
    .empty {
      --style: relative pt-168px flex-col items-center h-full flex-center;
      .icon {
        --style: bg-contain w-60px h-75px shrink-0;
        background-image: url('@images/logo-bg-gray.png');
      }

      span {
        --style: mt-24px text-14px lien-height-22px;
      }
    }
  }
}
</style>
