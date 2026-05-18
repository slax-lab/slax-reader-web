import { type UserInfo } from '@commons/types/interface'

export const useUserSubscribe = () => {
  const isSubscriptionExpired = ref(true)

  const checkSubscriptionExpired = () => {
    return false
  }

  const updateSubscribeStatus = (user: UserInfo) => {
    isSubscriptionExpired.value = checkUserSubscribedIsExpired(user)
  }

  return {
    isSubscriptionExpired,
    checkSubscriptionExpired,
    updateSubscribeStatus
  }
}
