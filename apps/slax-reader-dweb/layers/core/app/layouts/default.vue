<template>
  <div class="default-layout">
    <NuxtPwaAssets />
    <NuxtPage :keepalive="{ include: cacheRoutes }" />
  </div>
</template>

<script setup lang="ts">
import { isClient } from '@commons/utils/is'
import { getPreferredLanguage, isSlaxReaderApp } from '#layers/core/app/utils/environment'

import { useUserStore } from '#layers/core/app/stores/user'

const cacheRoutes = ['bookmarks']
const userStore = useUserStore()
const { locale, setLocale } = useI18n()
const preferredLang = getPreferredLanguage()

if (isSlaxReaderApp() && preferredLang && ['zh', 'en'].includes(preferredLang)) {
  setLocale(preferredLang)
} else if (userStore.currentLocale !== locale.value) {
  userStore.changeLocalLocale(userStore.currentLocale)
}

if (isClient) {
  userStore.checkAndRefreshUserToken()
}

// theme-color meta 跟随主题切换驱动浏览器 / iOS 状态栏 / Android 工具栏配色
// 三档值与 theme.tokens.css 内 --slax-bg 严格对位，PWA manifest 走 light 默认
const colorMode = useColorMode()
const themeColorMap: Record<string, string> = {
  light: '#faf8f2',
  dark: '#141210',
  eink: '#ffffff'
}

useHead({
  htmlAttrs: {
    lang: locale.value
  },
  meta: [
    {
      name: 'theme-color',
      content: computed(() => themeColorMap[colorMode.value] ?? themeColorMap.light)
    }
  ]
})

onMounted(() => {
  addChannelMessageHandler(chanelMessageHandler)
})

onUnmounted(() => {
  removeChannelMessageHandler(chanelMessageHandler)
})

const chanelMessageHandler = (name: keyof ChannelMessageData, data: Partial<ChannelMessageData>) => {
  if (name === 'refresh') {
    data[name]?.type === 'page' && window.location.reload()
  }
}
</script>

<style lang="scss" scoped>
.default-layout {
  --style: w-screen overflow-hidden;
}
</style>
