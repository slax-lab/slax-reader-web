<template>
  <div v-if="!isH5 && !panelOpen" class="edge-toolbar">
    <template v-for="(btn, idx) in buttons" :key="btn.id">
      <div v-if="idx > 0" class="edge-sep" />
      <button class="edge-btn" :class="{ active: modelValue === btn.id }" :title="btn.label" @click="toggle(btn.id)">
        <span class="edge-label">{{ btn.label }}</span>
        <span class="edge-icon" v-html="btn.icon" />
      </button>
    </template>
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

const buttons: { id: PanelId; label: string; icon: string }[] = [
  {
    id: 'ai',
    label: 'AI 解析',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2l.5 4 4 .5-4 .5-.5 4-.5-4-4-.5 4-.5z"/><path d="M15 12l.5 3 3 .5-3 .5-.5 3-.5-3-3-.5 3-.5z"/></svg>`
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>`
  },
  {
    id: 'comment',
    label: '评论',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
  }
]

const toggle = (id: PanelId) => {
  emits('update:modelValue', props.modelValue === id ? null : id)
}

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
.edge-toolbar {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-right: none;
  border-radius: var(--slax-radius-sm) 0 0 var(--slax-radius-sm);
  backdrop-filter: blur(12px);
  overflow: visible;
  z-index: 51;
  padding: 6px 0;

  .edge-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--slax-text-muted);
    transition: color 0.15s;

    &:hover {
      color: var(--slax-text);

      .edge-label {
        opacity: 1;
        transform: translateX(0);
        transition:
          transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
          opacity 0.1s;
      }
    }

    &.active {
      color: var(--slax-accent);
    }

    .edge-icon {
      position: relative;
      z-index: 2;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(svg) {
        width: 20px;
        height: 20px;
      }
    }

    .edge-label {
      position: absolute;
      right: 44px;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 14px 0 12px;
      background: var(--slax-surface);
      border: 1px solid var(--slax-border);
      border-right: none;
      border-radius: var(--slax-radius-sm) 0 0 var(--slax-radius-sm);
      backdrop-filter: blur(12px);
      font-size: 13px;
      color: var(--slax-text);
      white-space: nowrap;
      font-family: inherit;
      opacity: 0;
      transform: translateX(100%);
      pointer-events: none;
      transition:
        transform 0.2s ease-in,
        opacity 0.08s ease-in;
      z-index: -1;
    }
  }

  .edge-sep {
    width: 20px;
    height: 1px;
    background: var(--slax-border);
  }
}
</style>
