<template>
  <ClientOnly>
    <div class="theme-switcher" :class="{ expanded: isExpanded }" @mouseenter="isExpanded = true" @mouseleave="isExpanded = false">
      <button
        v-for="t_ in themes"
        :key="t_.key"
        :class="['theme-btn', { active: colorMode.preference === t_.key }]"
        :aria-pressed="colorMode.preference === t_.key"
        :title="t(t_.i18nKey)"
        @click="setTheme(t_.key)"
      >
        <span class="theme-icon" :aria-label="t(t_.i18nKey)">{{ t_.icon }}</span>
      </button>
    </div>

    <template #fallback>
      <div class="theme-switcher" aria-hidden="true">
        <div class="theme-btn-skeleton" />
      </div>
    </template>
  </ClientOnly>
</template>

<script lang="ts" setup>
type ThemeKey = 'light' | 'dark' | 'eink'

const colorMode = useColorMode()
const t = (key: string) => useNuxtApp().$i18n.t(key)
const isExpanded = ref(false)

const themes: { key: ThemeKey; i18nKey: string; icon: string }[] = [
  { key: 'light', i18nKey: 'common.theme.light', icon: '☀' },
  { key: 'dark', i18nKey: 'common.theme.dark', icon: '🌙' },
  { key: 'eink', i18nKey: 'common.theme.eink', icon: '📖' }
]

const setTheme = (key: ThemeKey) => {
  colorMode.preference = key
  isExpanded.value = false
}
</script>

<style lang="scss" scoped>
.theme-switcher {
  --style: relative flex items-center h-28px overflow-hidden;
  // 收起态：只显示当前 active 按钮宽度
  width: 28px;
  transition: width var(--slax-dur-normal) var(--slax-ease-spring);
  border-radius: var(--slax-radius-sm);
  border: 1px solid var(--slax-border);

  &.expanded {
    // 展开 3 个按钮，每个 28px
    width: 84px;
    border-color: var(--slax-accent-soft);
  }

  .theme-btn {
    --style: 'flex-none w-28px h-28px flex items-center justify-center cursor-pointer transition-colors duration-fast';
    background: transparent;
    color: var(--slax-text-light);
    font-size: 13px;

    &:hover {
      background: var(--slax-accent-bg);
      color: var(--slax-text);
    }

    &.active {
      background: var(--slax-accent-bg);
      color: var(--slax-accent);
    }
  }

  .theme-btn-skeleton {
    --style: h-28px w-28px;
    background: var(--slax-surface);
  }
}
</style>
