<template>
  <div class="bottom-toolbar" :class="{ 'h5-mode': isH5 }">
    <template v-for="(action, idx) in visibleActions" :key="action.id">
      <div v-if="idx > 0" class="toolbar-sep" />
      <button class="toolbar-btn" :class="{ active: action.active }" :title="action.label" @click="$emit('action', action)">
        <span class="btn-icon" v-html="action.icon" />
        <span v-if="!isNarrow" class="btn-label">{{ action.label }}</span>
      </button>
    </template>
    <template v-if="isH5Mobile">
      <div class="toolbar-sep" />
      <button class="toolbar-btn" :title="$t('common.operate.more')" @click="$emit('more')">
        <span class="btn-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="13" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <span v-if="!isNarrow" class="btn-label">{{ $t('common.operate.more') }}</span>
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
export interface BottomToolbarAction {
  id: string
  icon: string
  label: string
  active?: boolean
  visible?: boolean
}

const props = defineProps<{
  actions: BottomToolbarAction[]
}>()

defineEmits<{
  action: [action: BottomToolbarAction]
  more: []
}>()

const visibleActions = computed(() => props.actions.filter(a => a.visible !== false))

// H5 断点：≤768px 显示「更多」按钮；≤600px 只显图标
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

if (import.meta.client) {
  const onResize = () => {
    windowWidth.value = window.innerWidth
  }
  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))
}

const isH5 = computed(() => windowWidth.value <= 768)
const isH5Mobile = computed(() => windowWidth.value <= 768)
const isNarrow = computed(() => windowWidth.value <= 600)
</script>

<style lang="scss" scoped>
.bottom-toolbar {
  position: fixed;
  bottom: 24px;
  left: calc(50% - var(--slax-push-amount, 0px) / 2);
  transform: translateX(-50%);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: 16px;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: var(--slax-shadow-warm);
  z-index: 20;

  .toolbar-sep {
    width: 1px;
    height: 20px;
    background: var(--slax-border);
    margin: 0 4px;
    flex-shrink: 0;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: transparent;
    border: none;
    border-radius: var(--slax-radius-sm);
    cursor: pointer;
    color: var(--slax-text-muted);
    font-size: 13px;
    font-family: inherit;
    transition: all 0.15s;
    white-space: nowrap;

    &:hover {
      background: var(--slax-accent-bg);
      color: var(--slax-text);
    }

    &.active {
      color: var(--slax-accent);
    }

    .btn-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(svg) {
        width: 18px;
        height: 18px;
      }
    }
  }

  // H5 ≤600px 只显图标
  &.h5-mode .btn-label {
    display: none;
  }
}
</style>
