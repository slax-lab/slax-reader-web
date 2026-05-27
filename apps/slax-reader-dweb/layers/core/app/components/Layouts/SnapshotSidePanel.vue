<template>
  <aside class="side-panel" :class="{ open: activeTab !== null, 'is-resizing': isDragging }" :style="{ width: panelWidth + 'px' }" :data-active-tab="activeTab">
    <!-- 拖拽手柄 -->
    <div class="side-panel-resize" @mousedown="startDrag" @touchstart.prevent="startDrag" />

    <div class="side-panel-body">
      <!-- 三 slot 始终挂载（v-show），避免 AISummaries 摘要缓存 / ChatBot 消息历史被卸载丢失 -->
      <div v-show="activeTab === 'ai'" class="panel-slot">
        <slot name="ai" />
      </div>
      <div v-show="activeTab === 'chat'" class="panel-slot">
        <slot name="chat" />
      </div>
      <div v-show="activeTab === 'comment'" class="panel-slot">
        <slot name="comment" />
      </div>
    </div>

    <nav class="side-panel-tabs">
      <button class="side-panel-close" :title="$t('common.operate.cancel')" @click="$emit('update:activeTab', null)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        :title="tab.label"
        @click="$emit('update:activeTab', activeTab === tab.id ? null : tab.id)"
      >
        <span class="tab-icon" v-html="tab.icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { useSnapshotLayout } from '#layers/core/app/composables/useSnapshotLayout'

type TabId = 'ai' | 'chat' | 'comment'

const props = defineProps<{
  activeTab: TabId | null
}>()

defineEmits<{
  'update:activeTab': [tab: TabId | null]
}>()

const { panelWidth, isDragging, startDrag } = useSnapshotLayout()

const tabs: { id: TabId; label: string; icon: string }[] = [
  {
    id: 'ai',
    label: 'AI',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V10C14 10.55 13.55 11 13 11H5L2 14V3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`
  },
  {
    id: 'comment',
    label: '评论',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M3 7H10M3 10H8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
  }
]
</script>

<style lang="scss" scoped>
.side-panel {
  --style: fixed top-0 right-0 h-screen z-30 flex;
  min-width: var(--slax-side-panel-min-w);
  max-width: var(--slax-side-panel-max-w);
  transform: translateX(100%);
  transition: transform 0.3s var(--slax-ease-spring);
  background: var(--slax-surface-solid);
  border-left: 1px solid var(--slax-border);

  &.open {
    transform: translateX(0);
  }

  &.is-resizing {
    transition: none;
  }
}

.side-panel-resize {
  --style: absolute left-0 top-0 h-full w-4px cursor-col-resize z-10;

  &:hover {
    background: var(--slax-accent-soft);
    opacity: 0.4;
  }
}

.side-panel-body {
  --style: flex-1 overflow-hidden flex flex-col;
}

.panel-slot {
  --style: h-full overflow-y-auto;
}

.side-panel-tabs {
  --style: flex-none w-44px flex flex-col items-center pt-12px gap-4px border-l-(1px solid border);
  background: var(--slax-surface);
}

.side-panel-close {
  --style: 'w-32px h-32px flex items-center justify-center rounded-sm cursor-pointer transition-colors duration-fast mb-8px';
  color: var(--slax-text-light);
  background: transparent;

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }
}

.tab-btn {
  --style: 'w-36px flex flex-col items-center gap-4px py-10px rounded-sm cursor-pointer transition-colors duration-fast';
  color: var(--slax-text-light);
  background: transparent;

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }

  &.active {
    color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }

  .tab-icon {
    --style: 'w-16px h-16px flex items-center justify-center';

    :deep(svg) {
      --style: w-full h-full;
    }
  }

  .tab-label {
    font-size: 10px;
    line-height: 1;
  }
}

// H5：全屏宽度
.side-panel {
  @media (max-width: 768px) {
    width: 100vw !important;
    max-width: 100vw;
  }
}
</style>
