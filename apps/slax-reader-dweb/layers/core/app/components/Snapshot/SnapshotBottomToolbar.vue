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
  --style: fixed bottom-24px left-1/2 -translate-x-1/2 z-40 flex items-center;
  // 随 SidePanel 推移时跟随正文做中心点位移
  transform: translateX(calc(-50% + calc(var(--slax-push-amount, 0px) * -0.5)));
  transition: transform var(--slax-dur-normal);
  background: var(--slax-surface-solid);
  backdrop-filter: var(--slax-blur);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: var(--slax-shadow-warm);
  padding: 6px 8px;
  gap: 2px;
}

.toolbar-sep {
  --style: w-1px h-20px mx-4px flex-none;
  background: var(--slax-border);
}

.toolbar-btn {
  --style: 'flex items-center gap-6px px-10px py-8px rounded-sm cursor-pointer transition-colors duration-fast';
  color: var(--slax-text-muted);
  background: transparent;
  font-size: var(--slax-fs-aux);
  white-space: nowrap;

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }

  &.active {
    color: var(--slax-accent);
  }

  .btn-icon {
    --style: 'flex-none w-16px h-16px flex items-center justify-center';

    :deep(svg) {
      --style: w-full h-full;
    }
  }
}

// H5 ≤600px 只显图标
.bottom-toolbar.h5-mode .btn-label {
  display: none;
}
</style>
