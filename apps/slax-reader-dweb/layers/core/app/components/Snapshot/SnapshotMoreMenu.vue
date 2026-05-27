<template>
  <div class="more-menu-wrap" ref="wrapEl">
    <button class="more-btn" :class="{ active: isOpen }" :title="$t('common.operate.more')" @click.stop="toggle">
      <!-- 竖向三点 icon -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="3" r="1.5" fill="currentColor" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="8" cy="13" r="1.5" fill="currentColor" />
      </svg>
    </button>
    <Transition name="popover">
      <div v-if="isOpen" class="more-popover" v-on-click-outside="close">
        <button v-for="item in actions" :key="item.id" class="popover-item" :class="{ danger: item.danger }" @click="handleAction(item)">
          {{ item.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { vOnClickOutside } from '@vueuse/components'
import { useExclusivePopover } from '#layers/core/app/composables/useExclusivePopover'

export interface MoreMenuAction {
  id: string
  label: string
  danger?: boolean
}

defineProps<{
  actions: MoreMenuAction[]
}>()

const emits = defineEmits<{
  action: [action: MoreMenuAction]
}>()

const { isOpen, toggle, close } = useExclusivePopover()

const handleAction = (action: MoreMenuAction) => {
  emits('action', action)
  close()
}
</script>

<style lang="scss" scoped>
.more-menu-wrap {
  --style: relative;
}

.more-btn {
  --style: 'w-28px h-28px flex items-center justify-center rounded-sm cursor-pointer transition-colors duration-fast';
  color: var(--slax-text-light);
  background: transparent;

  &:hover,
  &.active {
    color: var(--slax-text);
    background: var(--slax-accent-bg);
  }
}

.more-popover {
  --style: absolute z-200 top-full right-0 mt-8px;
  min-width: 160px;
  padding: 4px;
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  box-shadow: var(--slax-shadow-warm);

  .popover-item {
    --style: 'w-full px-16px py-10px flex items-center rounded-sm cursor-pointer transition-colors duration-fast text-left whitespace-nowrap';
    color: var(--slax-text);
    font-size: var(--slax-fs-aux);
    background: transparent;

    &:hover {
      background: var(--slax-accent-bg);
    }

    &.danger {
      color: var(--slax-danger);
    }
  }
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.popover-enter-active,
.popover-leave-active {
  --style: transition-all duration-fast ease-in-out;
}
</style>
