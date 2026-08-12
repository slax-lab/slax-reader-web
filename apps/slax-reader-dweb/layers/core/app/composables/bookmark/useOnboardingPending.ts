// inbox onboarding 标记：按用户 id 存储在 localStorage，标识"该用户需要走一次 onboarding 引导"。
// 标记存在期间 useInboxOnboardingState 会强制返回状态 A（onboarding 巨幅引导），不再受此刻
// 插件安装/订阅数等实时状态影响——避免装完插件刷新页面后引导"退回"成列表内的轻量提示。
import { computed, type ComputedRef, type Ref, ref, toValue, watch } from 'vue'

const STORAGE_PREFIX = 'slax_onboarding_pending_'

export const useOnboardingPending = (userId: Ref<number | undefined> | ComputedRef<number | undefined>) => {
  const storageKey = computed(() => {
    const id = toValue(userId)
    return id ? `${STORAGE_PREFIX}${id}` : null
  })

  // localStorage 本身非响应式，用 ref 镶入组件系统；storageKey 变化（userId 就位/切换账号）时重新读取
  const isPending = ref(false)
  watch(
    storageKey,
    key => {
      isPending.value = !!key && localStorage.getItem(key) === 'true'
    },
    { immediate: true }
  )

  const setPending = () => {
    if (!storageKey.value) return
    localStorage.setItem(storageKey.value, 'true')
    isPending.value = true
  }

  const clearPending = () => {
    if (!storageKey.value) return
    localStorage.removeItem(storageKey.value)
    isPending.value = false
  }

  return { isPending, setPending, clearPending }
}
