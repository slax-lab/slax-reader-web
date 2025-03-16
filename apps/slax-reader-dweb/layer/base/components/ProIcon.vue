<template>
  <div class="pro-icon" v-if="isSubscribed || isProcessing">
    <span v-if="isSubscribed">Pro</span>
    <span v-else-if="isProcessing">{{ loadingTitle }}</span>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '#layers/base/stores/user'

const { t } = useI18n()

const userStore = useUserStore()
const loadingText = t('component.pro_icon.processing')
const loadingTitle = ref(loadingText)
const loadingInterval = ref<NodeJS.Timeout>()
const checkingInterval = ref<NodeJS.Timeout>()

const isSubscribed = computed(() => {
  return !userStore.isSubscriptionExpired
})
const isProcessing = computed(() => {
  return userStore.isSubscriptionExpired && userStore.isJustPaid
})

const enableChecking = () => {
  loadingInterval.value = setInterval(() => {
    const ellipses = loadingTitle.value.replace(loadingText, '')
    loadingTitle.value = `${loadingText}${Array.from({ length: (ellipses.length + 1) % 4 })
      .map(() => '.')
      .join('')}`
  }, 800)

  checkingInterval.value = setInterval(() => {
    userStore.refreshUserInfo()
  }, 5000)
}

const disableChecking = () => {
  clearInterval(checkingInterval.value)
  checkingInterval.value = undefined

  clearInterval(loadingInterval.value)
  loadingInterval.value = undefined
}

watch(
  () => isProcessing.value,
  (value, oldValue) => {
    if (value === oldValue) {
      return
    }

    if (value) {
      enableChecking()
    } else {
      disableChecking()
    }
  },
  {
    immediate: true
  }
)

onMounted(() => {})

onUnmounted(() => {
  disableChecking()
})
</script>

<style lang="scss" scoped>
.pro-icon {
  --style: inline-block px-6px h-20px flex-center rounded-6px bg-gradient-to-br from-#5ad297 to-#16b998 text-(12px #fff) relative;
}
</style>
