<template>
  <div
    class="snapshot-detail-layout"
    :class="{ 'h5-mode': isH5, 'panel-pushed': layoutMode === 'push' || layoutMode === 'push-soft' }"
    :style="{ '--slax-push-amount': pushAmount + 'px' }"
  >
    <slot name="topbar" />
    <slot name="tips" />
    <main class="snapshot-content">
      <slot />
    </main>
    <slot name="right-edge-toolbar" />
    <slot name="bottom-toolbar" />
    <slot name="side-panel" />
    <div v-if="isH5 && panelOpen" class="side-panel-overlay" @click="$emit('close-panel')" />
  </div>
</template>

<script lang="ts" setup>
import { useSnapshotLayout } from '#layers/core/app/composables/useSnapshotLayout'

defineEmits<{
  'close-panel': []
}>()

const { isH5, layoutMode, pushAmount, panelOpen } = useSnapshotLayout()

defineExpose({ isH5, layoutMode, pushAmount, panelOpen })
</script>

<style lang="scss" scoped>
.snapshot-detail-layout {
  --style: w-full min-h-screen relative flex flex-col items-center bg-surface-solid;
}

.snapshot-content {
  --style: w-full flex flex-col items-center;
  // 顶栏高度偏移（snapshot 档 52px）
  padding-top: var(--slax-header-h-snapshot);

  @media (max-width: 768px) {
    padding-top: var(--slax-header-h-mobile);
  }
}

.side-panel-overlay {
  --style: fixed inset-0 z-30;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}
</style>
