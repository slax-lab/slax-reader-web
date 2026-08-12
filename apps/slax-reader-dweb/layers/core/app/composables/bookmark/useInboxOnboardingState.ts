// inbox 空态三态判断：A 未装插件+无订阅+inbox空（onboarding 巨幅引导，多步）/
// B 未装插件+有订阅或有内容（列表内安装提示）/ C 已装插件（纯净空态）。
//
// A 一旦自然触发（首次判定成立）就落一个按 userId 存储的 onboarding 标记（见 useOnboardingPending），
// 标记生效期间恒定返回 'A'，不再受此刻插件/订阅实时状态影响——避免用户装完插件刷新页面后，
// 引导从"整页引导"退回成"列表内轻量提示"（多步引导需要在同一个入口里继续往下走）。
// 标记的清除交给消费方（BookmarksOnboardingHero 内"稍后再说"/走完引导时调用 clearOnboardingPending），
// 但如果 inbox 在标记生效期间变为非空（如其他设备同步来的内容），本 composable 会自动清除标记，
// 避免真实收藏内容被过时的 onboarding 状态挡住。
//
// 提取成独立 composable，供页面（决定是否隐藏 sidebar/页头）和 BookmarksEmptyState（决定渲染哪个
// 空态组件）共享同一份判断结果，避免各自调用 useExtensionDetection 导致重复探测。
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
  // 探测（插件是否安装）和订阅数据都就位前不下结论，避免把"加载中"误判为"确定为0/未安装"
  const dataReady = computed(() => detection.checked.value && toValue(params.subscriptionReady))

  const inboxState = computed<InboxOnboardingState>(() => {
    if (!toValue(params.isCurrentInboxTab)) return null
    // 标记生效期间直接返回 A，不必等插件探测/订阅数据就位（避免侧边栏先闪一下再切换）
    if (onboarding.isPending.value) return 'A'
    if (!dataReady.value) return null
    if (!detection.isInstalled.value) return toValue(params.subscribedCount) === 0 && toValue(params.isDataEmpty) ? 'A' : 'B'
    return 'C'
  })

  // 自然判定为 A（首次成立）→ 落标记，后续维持 A 直到标记被清除
  // immediate:true：mount 时若首次计算即为 A（无标记情况下的自然判定），也要立刻落标记，
  // 否则 watch 默认只在"变化"时触发，不会响应初始值
  watch(
    inboxState,
    state => {
      if (state === 'A' && !onboarding.isPending.value) onboarding.setPending()
    },
    { immediate: true }
  )

  // 标记生效期间 inbox 变为非空 → 说明不再是"全新用户"场景，自动清除标记
  watch(
    () => onboarding.isPending.value && !toValue(params.isDataEmpty),
    shouldClear => {
      if (shouldClear) onboarding.clearPending()
    }
  )

  return { inboxState, clearOnboardingPending: onboarding.clearPending }
}
