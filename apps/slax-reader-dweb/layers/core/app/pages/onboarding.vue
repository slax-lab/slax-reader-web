<template>
  <div class="onboarding-view">
    <OnboardingTopBar @feedback="feedbackClick" />
    <main class="onboarding-main">
      <BookmarksOnboardingHero @skip="finish" @complete="finish" />
    </main>
  </div>
</template>

<script lang="ts" setup>
import BookmarksOnboardingHero from '#layers/core/app/components/BookmarkList/BookmarksOnboardingHero.vue'
import OnboardingTopBar from '#layers/core/app/components/BookmarkList/OnboardingTopBar.vue'

import { showFeedbackModal } from '#layers/core/app/components/Modal'
import { useOnboardingPending } from '#layers/core/app/composables/bookmark/useOnboardingPending'
import { useUserStore } from '#layers/core/app/stores/user'

const { t } = useI18n()
const userStore = useUserStore()

useHead({
  titleTemplate: t('common.app.name')
})

const userId = computed(() => userStore.userInfo?.userId)
const { isPending, clearPending } = useOnboardingPending(userId)

// 无 onboarding 标记（未走过 /bookmarks 的三态判定，或已经清过标记）→ 说明本页不适用，
// 直接退回 /bookmarks 交由那边重新判断。userId 未就位时 isPending 恒为 false（useOnboardingPending
// 拿不到 storageKey），故需同时判断 userStore.userInfo 是否已加载，避免首屏因用户信息未就位而误判退出。
watch(
  [() => userStore.userInfo, isPending],
  ([info, pending]) => {
    if (info && !pending) navigateTo('/bookmarks', { replace: true })
  },
  { immediate: true }
)

userStore.getUserInfo({ refresh: true })

// 完成引导（点击"稍后再说"或走完最后一步）：清标记 + 回到 /bookmarks
const finish = () => {
  clearPending()
  navigateTo('/bookmarks', { replace: true })
}

const feedbackClick = () => {
  showFeedbackModal({
    reportType: 'parse_error',
    title: '',
    email: userStore.userInfo?.email || '',
    params: {
      entry_point: 'onboarding'
    }
  })
}
</script>

<style lang="scss" scoped>
.onboarding-view {
  min-height: 100vh;
}

.onboarding-main {
  padding-top: var(--slax-header-height);

  @media (max-width: 768px) {
    padding-top: var(--slax-header-h-mobile);
  }
}
</style>
