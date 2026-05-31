<template>
  <!-- 列表页顶栏：56px 毛玻璃，Phase 2 接入完整内容 -->
  <header class="bookmarks-topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <slot name="left" />
      </div>
      <div class="topbar-right">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.bookmarks-topbar {
  --style: fixed top-0 left-0 right-0 z-50;
  height: var(--slax-header-height);
  background: var(--slax-topbar-bg);
  backdrop-filter: var(--slax-blur);
  border-bottom: 1px solid var(--slax-border);

  @media (max-width: 768px) {
    height: var(--slax-header-h-mobile);
  }
}

.topbar-inner {
  --style: h-full max-w-shell mx-auto px-28px flex items-center justify-between;
}

.topbar-left {
  --style: flex items-center gap-12px;
}

.topbar-right {
  --style: flex items-center gap-16px;
}
</style>
