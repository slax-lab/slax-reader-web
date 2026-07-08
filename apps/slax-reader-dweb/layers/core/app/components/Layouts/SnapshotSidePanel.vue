<template>
  <!-- 遮罩：点击关闭，仅 H5 -->
  <div class="side-panel-overlay" :class="{ open: activeTab !== null }" @click="$emit('update:activeTab', null)" />

  <aside class="side-panel" :class="{ open: activeTab !== null, 'is-resizing': isDragging || isSheetDragging }" :style="panelStyle" :data-active-tab="activeTab">
    <!-- 桌面：宽度拖拽手柄 -->
    <div class="side-panel-resize" @mousedown="startDrag" @touchstart.prevent="startDrag" />
    <!-- 抓手：拖拽调高，仅 H5 -->
    <div class="side-panel-grab" @mousedown="startSheetDrag" @touchstart.prevent="startSheetDrag" />

    <div class="side-panel-body">
      <!-- 各 tab 常挂载，避免丢缓存 -->
      <div v-show="activeTab === 'ai'" class="panel-slot scrollbar-hide">
        <slot name="ai" />
      </div>
      <div v-show="activeTab === 'transcript'" class="panel-slot scrollbar-hide">
        <slot name="transcript" />
      </div>
      <div v-show="activeTab === 'chat'" class="panel-slot scrollbar-hide">
        <slot name="chat" />
      </div>
      <div v-show="activeTab === 'comment'" class="panel-slot scrollbar-hide">
        <slot name="comment" />
      </div>
    </div>

    <nav class="side-panel-tabs">
      <button class="side-panel-close" :title="$t('common.operate.collapse')" :aria-label="$t('common.operate.collapse')" @click="$emit('update:activeTab', null)">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <g transform="translate(-0.6213, 3)">
            <rect x="2.62132034" y="0" width="12" height="1" rx="0.5" />
            <rect x="8.62132034" y="4" width="6" height="1" rx="0.5" />
            <rect x="8.62132034" y="8" width="6" height="1" rx="0.5" />
            <path
              d="M1.85781322,4.53638274 L5.52799613,4.02963623 C5.80154341,3.99186723 6.05391512,4.18300329 6.09168411,4.45655057 C6.09794923,4.50192655 6.09794923,4.54794824 6.09168411,4.59332421 L5.5849376,8.26350713 C5.5547224,8.48234495 5.35282503,8.6352538 5.13398721,8.60503861 C5.04761613,8.59311325 4.96750692,8.55329336 4.90585395,8.49164039 L1.62967996,5.2154664 C1.47347024,5.05925668 1.47347024,4.80599068 1.62967996,4.64978096 C1.69133293,4.58812799 1.77144214,4.5483081 1.85781322,4.53638274 Z"
            />
          </g>
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

// 多根组件，关 attr 继承防告警
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  activeTab: SnapshotPanelId | null
  // 展示的面板子集，不传则全部
  panels?: SnapshotPanelId[]
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: SnapshotPanelId | null]
}>()

const { panelWidth, isDragging, startDrag, isH5 } = useSnapshotLayout()
const { t } = useI18n()

const tabs = computed(() => resolveSnapshotPanels(props.panels, t))

// 宽度内联，高度交给 CSS
// 抓手下拉跟手，松手按阈值收起
const dragOffset = ref(0)
const isSheetDragging = ref(false)
const panelStyle = computed(() => ({
  width: panelWidth.value + 'px',
  // 下拉时接管 transform，松手交还 CSS
  ...(isSheetDragging.value ? { transform: `translateY(${dragOffset.value}px)` } : {})
}))

// 下拉超过该位移即收起，阈值偏小
const DISMISS_THRESHOLD = 40

let dragStartY = 0

const onSheetMove = (e: MouseEvent | TouchEvent) => {
  const y = 'touches' in e ? e.touches[0]!.clientY : e.clientY
  // 只向下跟手
  dragOffset.value = Math.max(0, y - dragStartY)
  if (e.cancelable) e.preventDefault()
}

const onSheetUp = () => {
  window.removeEventListener('mousemove', onSheetMove)
  window.removeEventListener('mouseup', onSheetUp)
  window.removeEventListener('touchmove', onSheetMove)
  window.removeEventListener('touchend', onSheetUp)
  if (!isSheetDragging.value) return
  const shouldDismiss = dragOffset.value > DISMISS_THRESHOLD
  // 交还 CSS 过渡：收起或回弹
  isSheetDragging.value = false
  dragOffset.value = 0
  if (shouldDismiss) emit('update:activeTab', null)
}

const startSheetDrag = (e: MouseEvent | TouchEvent) => {
  if (!isH5.value) return // 桌面兜底
  dragStartY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
  dragOffset.value = 0
  isSheetDragging.value = true
  window.addEventListener('mousemove', onSheetMove)
  window.addEventListener('mouseup', onSheetUp)
  window.addEventListener('touchmove', onSheetMove, { passive: false })
  window.addEventListener('touchend', onSheetUp)
}

onBeforeUnmount(onSheetUp) // 兜底解绑

// 转小屏自动收起
watch(isH5, h5 => {
  if (h5 && props.activeTab !== null) emit('update:activeTab', null)
})
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
  // 锁滚动链，不带动外部详情页
  overscroll-behavior: contain;
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

// 遮罩+抓手：桌面隐藏
.side-panel-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.side-panel-grab {
  display: none;
}

// H5：底部上滑 sheet
@media (max-width: 768px) {
  .side-panel-overlay.open {
    display: block;
  }

  .side-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100vw !important;
    max-width: 100vw;
    min-width: 0;
    // 高度随内容，CSS 约束
    max-height: 90vh;
    min-height: 40vh;
    transform: translateY(100%);
    z-index: 45; // 介于底栏与 topbar
    border-left: none;
    border-top: 1px solid var(--slax-border);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
  }

  .side-panel.open {
    transform: translateY(0);
  }

  // 抓手视觉条
  .side-panel::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--slax-text-light);
    opacity: 0.4;
    pointer-events: none;
    z-index: 3;
  }

  .side-panel-grab {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    cursor: grab;
    touch-action: none;
    z-index: 2;
  }

  .side-panel-resize {
    display: none; // 关宽度拖拽
  }

  .side-panel-tabs {
    display: none; // 改由底栏触发
  }

  .side-panel-body {
    padding-top: 20px; // 让出抓手空间
    border-left: none;
  }
}
</style>
