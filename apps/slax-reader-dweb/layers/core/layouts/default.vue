<template>
  <div class="default-layout">
    <NuxtPwaAssets />
    <NuxtPage :keepalive="{ include: cacheRoutes }" />
  </div>
</template>

<script setup lang="ts">
import { isClient } from '@commons/utils/is'

import { useUserStore } from '#layers/core/stores/user'

const cacheRoutes = ['bookmarks']
const userStore = useUserStore()
const { locale, setLocale } = useI18n()

const urlParams = window ? new URLSearchParams(window.location.search) : null
const langParam = urlParams ? (urlParams.get('lang') as 'zh' | 'en') : null

if (langParam && ['zh', 'en'].includes(langParam)) {
  setLocale(langParam)
} else if (userStore.currentLocale !== locale.value) {
  userStore.changeLocalLocale(userStore.currentLocale)
}

if (isClient) {
  userStore.checkAndRefreshUserToken()
}

useHead({
  htmlAttrs: {
    lang: locale.value
  }
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
