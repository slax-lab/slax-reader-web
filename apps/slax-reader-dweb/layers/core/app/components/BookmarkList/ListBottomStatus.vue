<template>
  <!-- 列表底部状态：加载中 / 已到末尾。未选话题或合集时不展示（占位选择态） -->
  <div class="bottom-status" v-if="showStatus">
    <TransitionGroup name="opacity">
      <div class="loading" v-if="loading && !isRefreshLoading">
        <div class="icon"></div>
        <span class="ml-5">{{ $t('page.bookmarks_index.more') }}</span>
      </div>
      <ListEndHint v-else-if="!loading && ending" :text="isInTrash ? $t('page.bookmarks_index.trash_no_more') : $t('page.bookmarks_index.no_more')" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import ListEndHint from '#layers/core/app/components/ListEndHint.vue'

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
}
</style>
