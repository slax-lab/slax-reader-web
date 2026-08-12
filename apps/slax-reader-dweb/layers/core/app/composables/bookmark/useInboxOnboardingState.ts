// inbox 空态三态判断
import { computed, type ComputedRef, type Ref, toValue, watch } from 'vue'

import { useOnboardingPending } from '#layers/core/app/composables/bookmark/useOnboardingPending'
import { useExtensionDetection } from '#layers/core/app/composables/useExtensionDetection'

export type InboxOnboardingState = 'A' | 'B' | 'C' | null

export const useInboxOnboardingState = (params: {
  isCurrentInboxTab: Ref<boolean> | ComputedRef<boolean>
  subscribedCount: Ref<number> | ComputedRef<number>
  subscriptionReady: Ref<boolean> | ComputedRef<boolean>
  isDataEmpty: Ref<boolean> | ComputedRef<boolean>
  userId: Ref<number | undefined> | ComputedRef<number | undefined>
}) => {
  const detection = useExtensionDetection()
  const onboarding = useOnboardingPending(params.userId)
  // 数据未就位前不下结论
  const dataReady = computed(() => detection.checked.value && toValue(params.subscriptionReady))

  const inboxState = computed<InboxOnboardingState>(() => {
    if (!toValue(params.isCurrentInboxTab)) return null
    if (onboarding.isPending.value) return 'A'
    if (!dataReady.value) return null
    if (!detection.isInstalled.value) return toValue(params.subscribedCount) === 0 && toValue(params.isDataEmpty) ? 'A' : 'B'
    return 'C'
  })

  // immediate 取初始值
  watch(
    inboxState,
    state => {
      if (state === 'A' && !onboarding.isPending.value) onboarding.setPending()
    },
    { immediate: true }
  )

  // 非空后自动清标记
  watch(
    () => onboarding.isPending.value && !toValue(params.isDataEmpty),
    shouldClear => {
      if (shouldClear) onboarding.clearPending()
    }
  )

  return { inboxState, clearOnboardingPending: onboarding.clearPending }
}
