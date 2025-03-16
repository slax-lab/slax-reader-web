import { checkUserSubscribedIsExpired } from '~/utils/isolation/subscribe'

import { type UserInfo } from '@commons/types/interface'
import { showSubscriptionModal } from '#layers/base/components/isolation/Payment'

export const useSubscribe = () => {
  const isSubscriptionExpired = ref(true)

  const checkSubscriptionExpired = () => {
    if (isSubscriptionExpired.value) {
      showSubscriptionModal()
      return true
    }

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
