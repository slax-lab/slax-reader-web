<!-- 统一的标签 chip：标签页 / 添加面板 / 列表卡片共用 -->
<template>
  <span
    class="tag-chip"
    :class="{ mine: tag.source === 'mine', active, compact, clickable: !!onClickListener }"
    :title="tag.show_name"
    role="button"
    :tabindex="onClickListener ? 0 : -1"
    @click.stop="emit('click', tag)"
    @keydown.enter.stop="emit('click', tag)"
  >
    <span class="tag-name">{{ tag.show_name }}</span>
    <span v-if="typeof count === 'number'" class="tag-count">{{ count }}</span>
    <i v-if="aiMark" class="tag-ai" :title="$t('component.bookmark_tags.by_ai')">AI</i>
    <button v-if="promotable" class="tag-act promote" type="button" :title="$t('component.tags_header.promote')" @click.stop="emit('promote', tag)">↑</button>
    <button v-if="removable" class="tag-act remove" type="button" :title="$t('common.operate.delete')" @click.stop="emit('remove', tag)">×</button>
  </span>
</template>

<script lang="ts" setup>
import { getCurrentInstance } from 'vue'

import type { BookmarkTag } from '@commons/types/interface'

const props = defineProps<{
  tag: BookmarkTag
  active?: boolean
  removable?: boolean
  promotable?: boolean
  aiMark?: boolean
  count?: number
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [tag: BookmarkTag]
  remove: [tag: BookmarkTag]
  promote: [tag: BookmarkTag]
}>()

// 只有父级监听了 click 才把 chip 当按钮画
const onClickListener = !!getCurrentInstance()?.vnode.props?.onClick
void props
</script>

<style lang="scss" scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 4px 10px;
  border: 1px solid var(--slax-border);
  border-radius: 999px;
  background: var(--slax-surface-solid);
  color: var(--slax-text);
  font-size: var(--slax-fs-tag);
  line-height: 1.5;
  white-space: nowrap;
  user-select: none;
  transition:
    background var(--slax-dur-normal),
    border-color var(--slax-dur-normal),
    color var(--slax-dur-normal);

  &.compact {
    padding: 2px 8px;
    gap: 4px;
  }

  &.mine {
    border-color: color-mix(in srgb, var(--slax-accent) 30%, var(--slax-border));
    background: var(--slax-accent-bg);
    color: var(--slax-accent);
  }

  &.active {
    border-color: var(--slax-accent);
    background: var(--slax-accent-bg);
    color: var(--slax-accent);
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: color-mix(in srgb, var(--slax-accent) 40%, var(--slax-border));
    }
  }

  .tag-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-count {
    font-size: 11px;
    opacity: 0.6;
  }

  .tag-ai {
    font:
      600 9px/1 ui-monospace,
      monospace;
    letter-spacing: 0.06em;
    padding: 2px 3px;
    border: 1px solid currentColor;
    border-radius: 3px;
    opacity: 0.55;
    font-style: normal;
  }

  .tag-act {
    display: none;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px solid var(--slax-border-strong);
    border-radius: 50%;
    background: var(--slax-surface-solid);
    color: inherit;
    font-size: 11px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      border-color: var(--slax-accent);
      color: var(--slax-accent);
    }
  }

  &:hover .tag-act,
  &:focus-within .tag-act {
    display: inline-grid;
    place-items: center;
  }
}
</style>
