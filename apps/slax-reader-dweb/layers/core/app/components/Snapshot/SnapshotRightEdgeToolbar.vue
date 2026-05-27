<template>
  <div v-if="!isH5 && !panelOpen" class="right-edge-toolbar">
    <button v-for="btn in buttons" :key="btn.id" class="edge-btn" :class="{ active: modelValue === btn.id }" :title="btn.label" @click="toggle(btn.id)">
      <span class="edge-icon" v-html="btn.icon" />
      <Transition name="edge-label">
        <span v-if="hoveredId === btn.id" class="edge-label">{{ btn.label }}</span>
      </Transition>
    </button>
  </div>
</template>

<script lang="ts" setup>
type PanelId = 'ai' | 'chat' | 'comment'

const props = defineProps<{
  modelValue: PanelId | null
  panelOpen?: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [value: PanelId | null]
}>()

const hoveredId = ref<PanelId | null>(null)

const buttons: { id: PanelId; label: string; icon: string }[] = [
  {
    id: 'ai',
    label: 'AI',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>`
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V10C14 10.55 13.55 11 13 11H5L2 14V3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>`
  },
  {
    id: 'comment',
    label: '评论',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4H13M3 7H10M3 10H8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`
  }
]

const toggle = (id: PanelId) => {
  emits('update:modelValue', props.modelValue === id ? null : id)
}

// H5 断点
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
if (import.meta.client) {
  const onResize = () => {
    windowWidth.value = window.innerWidth
  }
  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))
}
const isH5 = computed(() => windowWidth.value <= 768)
</script>

<style lang="scss" scoped>
.right-edge-toolbar {
  --style: fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col;
}

.edge-btn {
  --style: 'relative w-44px h-44px flex items-center justify-center cursor-pointer transition-colors duration-fast';
  // 仅左侧圆角
  border-radius: var(--slax-radius-sm) 0 0 var(--slax-radius-sm);
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-right: none;
  color: var(--slax-text-light);

  &:not(:first-child) {
    border-top: none;
  }

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }

  &.active {
    color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }

  .edge-icon {
    --style: 'w-16px h-16px flex items-center justify-center';

    :deep(svg) {
      --style: w-full h-full;
    }
  }
}

.edge-label {
  --style: absolute right-full top-1/2 -translate-y-1/2 mr-8px px-8px py-4px rounded-sm whitespace-nowrap text-aux pointer-events-none;
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  box-shadow: var(--slax-shadow-sm);
  color: var(--slax-text);
}

.edge-label-enter-from,
.edge-label-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(4px);
}

.edge-label-enter-active,
.edge-label-leave-active {
  --style: transition-all duration-fast;
}
</style>
