<template>
  <!-- 常驻根节点（display:contents，空时无盒子）。
       独立组件边界：keyed v-for 在自己的渲染 block 内增长，
       不受父 .tags-list block 内兄弟 .search-list 卸载影响（Vue 3.5 block patch null-anchor 崩溃根因） -->
  <div class="tags-cells">
    <div class="tag" v-for="tag in tags" :key="tag.id">
      <span class="tag-name">{{ tag.show_name }}</span>
      <button v-if="!readonly" class="tag-remove" :title="$t('common.operate.delete')" @click="emit('remove', tag.id)">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { BookmarkTag } from '@commons/types/interface'

defineProps<{
  tags: BookmarkTag[]
  readonly?: boolean
}>()
const emit = defineEmits<{ remove: [tagId: number] }>()

// [TAGDBG] 临时调试：确认 chips 列表已隔离到子组件渲染（排查完删除）
const dbg = (m: string) => {
  if (typeof window !== 'undefined') (window as any).__taglog?.(`BookmarkTagChips ${m}`)
}
onMounted(() => dbg('hook onMounted'))
onBeforeUpdate(() => dbg('hook onBeforeUpdate'))
onUpdated(() => dbg('hook onUpdated'))
onUnmounted(() => dbg('hook onUnmounted'))
onErrorCaptured((err, _i, info) => {
  dbg(`onErrorCaptured info=${info} msg=${(err as any)?.message}`)
  return undefined
})
</script>

<style lang="scss" scoped>
// 不生成盒子，.tag 仍是父 .tags-list 的 flex 子项
.tags-cells {
  display: contents;
}

.tag {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 13px;
  color: var(--slax-text-muted);
  background: transparent;
  border: 1px solid var(--slax-border);
  border-radius: 6px;
  cursor: default;
  transition: all 0.15s;

  .tag-name {
    --style: 'max-w-150px overflow-hidden whitespace-nowrap text-ellipsis';
  }

  .tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 14px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--slax-text-light);
    border-radius: 3px;
    transition: all 0.15s;
    border-left: 1px solid var(--slax-border);
    opacity: 0;
    width: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  &:hover .tag-remove {
    opacity: 1;
    width: 14px;
    margin-left: 6px;
    padding-left: 6px;
  }

  .tag-remove:hover {
    color: var(--slax-accent);
  }
}
</style>
