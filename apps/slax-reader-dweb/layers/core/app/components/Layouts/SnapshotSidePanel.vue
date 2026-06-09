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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div class="side-panel-tabs-group">
        <template v-for="(tab, idx) in tabs" :key="tab.id">
          <div v-if="idx > 0" class="panel-tab-sep" />
          <button class="side-panel-tab" :class="{ active: activeTab === tab.id }" :title="tab.label" @click="$emit('update:activeTab', activeTab === tab.id ? null : tab.id)">
            <span class="tab-icon" v-html="tab.icon" />
          </button>
        </template>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { resolveSnapshotPanels, type SnapshotPanelId } from '#layers/core/app/components/Snapshot/panels'
import { useSnapshotLayout } from '#layers/core/app/composables/useSnapshotLayout'

const props = defineProps<{
  activeTab: SnapshotPanelId | null
  // 要展示的面板 id 子集（顺序以注册表为准）；不传则全部展示。
  panels?: SnapshotPanelId[]
}>()

defineEmits<{
  'update:activeTab': [tab: SnapshotPanelId | null]
}>()

const { panelWidth, isDragging, startDrag } = useSnapshotLayout()

const tabs = computed(() => resolveSnapshotPanels(props.panels))
</script>

<style lang="scss" scoped>
.side-panel {
  --style: fixed right-0 bottom-0 z-30 flex;
  top: var(--slax-header-h-snapshot);
  min-width: var(--slax-side-panel-min-w);
  max-width: var(--slax-side-panel-max-w);
  transform: translateX(100%);
  transition: transform 0.3s var(--slax-ease-spring);
  background: var(--slax-surface-solid);
  border-left: 1px solid var(--slax-border);

  @media (max-width: 768px) {
    top: var(--slax-header-h-mobile);
  }

  &.open {
    transform: translateX(0);
  }

  &.is-resizing {
    transition: none;
  }
}

.side-panel-resize {
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 32px;
    background: var(--slax-border);
    border-radius: 1px;
    opacity: 1;
    transition: background 0.15s;
  }

  &:hover::after {
    background: var(--slax-text-light);
  }
}

.side-panel-body {
  --style: flex-1 overflow-hidden flex flex-col;
}

.panel-slot {
  --style: h-full overflow-y-auto;
}

.side-panel-tabs {
  width: 44px;
  flex-shrink: 0;
  border-left: 1px solid var(--slax-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  height: 100%;
  position: relative;
  background: var(--slax-surface);
}

.side-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--slax-text-light);
  transition: color 0.15s;

  &:hover {
    color: var(--slax-text);
  }
}

.side-panel-tabs-group {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.side-panel-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--slax-text-light);
  transition: color 0.15s;

  &:hover {
    color: var(--slax-text);
  }

  &.active {
    color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }

  .tab-icon {
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
}

.panel-tab-sep {
  width: 20px;
  height: 1px;
  background: var(--slax-border);
}

// H5：全屏宽度
.side-panel {
  @media (max-width: 768px) {
    width: 100vw !important;
    max-width: 100vw;
  }
}
</style>
