<template>
  <!-- /onboarding 专属顶栏 -->
  <header class="onboarding-topbar">
    <div class="topbar-inner">
      <button class="topbar-logo" type="button" @click="navigateTo('/bookmarks')">
        <img src="@images/icon-logo-bookmark.png" width="24" height="24" alt="Slax Reader" />
        {{ $t('common.app.name') }}
      </button>

      <div class="topbar-actions">
        <BookmarksUserMenu @feedback="emit('feedback')" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import BookmarksUserMenu from '#layers/core/app/components/BookmarkList/BookmarksUserMenu.vue'

const emit = defineEmits<{
  feedback: []
}>()
</script>

<style lang="scss" scoped>
.onboarding-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: var(--slax-header-height);
  background: var(--slax-topbar-bg);
  backdrop-filter: var(--slax-blur);
  border-bottom: 1px solid var(--slax-border);

  @media (max-width: 768px) {
    height: var(--slax-header-h-mobile);
  }
}

.topbar-inner {
  height: 100%;
  max-width: var(--slax-shell-w);
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--slax-font-serif);
  font-weight: 500;
  font-size: 20px;
  color: var(--slax-text);
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  letter-spacing: -0.02em;

  img {
    flex-shrink: 0;
    display: block;
  }
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
