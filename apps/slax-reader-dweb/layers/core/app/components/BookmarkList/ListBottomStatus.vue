<template>
  <!-- 列表底部状态：加载中 / 已到末尾。未选话题或合集时不展示（占位选择态） -->
  <div class="bottom-status" v-if="showStatus">
    <TransitionGroup name="opacity">
      <div class="loading" v-if="loading && !isRefreshLoading">
        <div class="icon"></div>
        <span class="ml-5">{{ $t('page.bookmarks_index.more') }}</span>
      </div>
      <div class="end" v-else-if="!loading && ending">
        <div class="line"></div>
        <span>{{ isInTrash ? $t('page.bookmarks_index.trash_no_more') : $t('page.bookmarks_index.no_more') }}</span>
        <div class="line"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  ending: boolean
  isRefreshLoading: boolean
  isInTrash: boolean
  filterStatus: string
  filterTopicId: number
  filterCollectionId: number
}>()

// 复刻原 guard：话题/合集 tab 未选择具体 id 时，不展示底部状态（停留在选择占位态）
const showStatus = computed(() => !((props.filterStatus === 'topics' && !props.filterTopicId) || (props.filterStatus === 'collections' && !props.filterCollectionId)))
</script>

<style lang="scss" scoped>
.bottom-status {
  --style: select-none relative shrink-0;
  padding: 48px 0 0;
  text-align: center;

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--slax-text-light);
    font-size: 13px;

    .icon {
      --style: 'i-svg-spinners:90-ring text-aux';
    }
  }

  .end {
    // demo 同款：斜体衬线字体，淡色
    font-family: var(--slax-font-serif);
    font-size: 13px;
    color: var(--slax-text-light);
    font-weight: 300;
    font-style: italic;

    // 隐藏旧的两条线
    .line {
      display: none;
    }

    span {
      --style: mx-0;
    }
  }
}
</style>
