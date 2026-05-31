<template>
  <!-- 空数据视图：圆形 icon 容器 + 衬线标题 + 描述文字，对齐 demo .empty-view -->
  <div class="empty-view">
    <div class="empty-view-icon">
      <slot name="icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </slot>
    </div>
    <h3 class="empty-view-title">{{ title }}</h3>
    <p class="empty-view-desc">{{ desc }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  desc: string
}>()
</script>

<style lang="scss" scoped>
.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 96px 24px 48px;
}

.empty-view-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slax-text-light);
  margin-bottom: 24px;

  svg {
    opacity: 0.7;
  }
}

.empty-view-title {
  font-family: var(--slax-font-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--slax-text);
  margin: 0 0 8px;
  letter-spacing: 0.01em;
}

.empty-view-desc {
  font-size: 14px;
  color: var(--slax-text-light);
  margin: 0;
  line-height: 1.7;
  max-width: 360px;
}
</style>
