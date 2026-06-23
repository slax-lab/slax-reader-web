<template>
  <!-- 内容尽头：文案左右各一横杆 -->
  <div class="list-end-hint">
    <span class="line" aria-hidden="true" />
    <span>{{ text }}</span>
    <span class="line" aria-hidden="true" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ text: string }>()
</script>

<style lang="scss" scoped>
.list-end-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  // 衬线斜体淡色，对齐 demo
  font-family: var(--slax-font-serif);
  font-size: 13px;
  font-weight: 300;
  font-style: italic;
  color: var(--slax-text-light);

  // 横杆颜色随文字，保持一致
  .line {
    width: 24px;
    height: 1px;
    background: currentColor;
    opacity: 0.5;
  }
}
</style>
