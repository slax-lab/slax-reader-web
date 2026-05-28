<template>
  <ClientOnly>
    <div class="theme-switcher">
      <button
        v-for="t_ in themes"
        :key="t_.key"
        :class="['theme-btn', { active: colorMode.preference === t_.key }]"
        :aria-pressed="colorMode.preference === t_.key"
        @click="setTheme(t_.key)"
      >
        {{ t(t_.i18nKey) }}
      </button>
    </div>

    <template #fallback>
      <div class="theme-switcher" aria-hidden="true">
        <div v-for="i in 4" :key="i" class="theme-btn-skeleton" />
      </div>
    </template>
  </ClientOnly>
</template>

<script lang="ts" setup>
type ThemeKey = 'light' | 'dark' | 'eink' | 'system'

const colorMode = useColorMode()
const t = (key: string) => useNuxtApp().$i18n.t(key)

const themes: { key: ThemeKey; i18nKey: string }[] = [
  { key: 'light', i18nKey: 'common.theme.light' },
  { key: 'dark', i18nKey: 'common.theme.dark' },
  { key: 'eink', i18nKey: 'common.theme.eink' },
  { key: 'system', i18nKey: 'common.theme.system' }
]

const setTheme = (key: ThemeKey) => {
  colorMode.preference = key
}
</script>

<style lang="scss" scoped>
.theme-switcher {
  --style: 'flex gap-2';

  .theme-btn {
    --style: 'px-3 py-1 rounded-sm text-sm transition-colors cursor-pointer';
    border: 1px solid var(--slax-border);
    color: var(--slax-text-light);
    background: transparent;

    &:hover {
      color: var(--slax-text);
    }

    &.active {
      background: var(--slax-accent-bg);
      color: var(--slax-accent);
      border-color: var(--slax-accent);
    }
  }

  .theme-btn-skeleton {
    --style: 'h-7 w-16 rounded-sm';
    background: var(--slax-surface);
  }
}
</style>
