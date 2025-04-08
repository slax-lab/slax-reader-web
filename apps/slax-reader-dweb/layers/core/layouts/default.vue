<template>
  <div class="default-layout">
    <NuxtPwaAssets />
    <NuxtPage :keepalive="{ include: cacheRoutes }" />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '#layers/core/stores/user'

const cacheRoutes = ['bookmarks']
const userStore = useUserStore()
const { locale } = useI18n()

if (userStore.currentLocale !== locale.value) {
  userStore.changeLocalLocale(userStore.currentLocale)
}

userStore.checkAndRefreshUserToken()

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
