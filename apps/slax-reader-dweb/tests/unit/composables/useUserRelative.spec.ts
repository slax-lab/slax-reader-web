// useUserRelative.useUserSubscribe 单元测试
// 19 行源码：3 个返回（isSubscriptionExpired ref / checkSubscriptionExpired 占位 / updateSubscribeStatus）
// 注意：checkUserSubscribedIsExpired (utils/userRelative.ts) 是占位实现总返 false（已在 sprint 6.1 user-relative 100% 覆盖）

import { useUserSubscribe } from '~~/layers/core/app/composables/useUserRelative'
import { baseUser, makeUser } from '~~/tests/fixtures/user'
import { describe, expect, it } from 'vitest'

describe('useUserSubscribe', () => {
  it('return 三个字段：isSubscriptionExpired / checkSubscriptionExpired / updateSubscribeStatus', () => {
    const result = useUserSubscribe()
    expect(result).toHaveProperty('isSubscriptionExpired')
    expect(result).toHaveProperty('checkSubscriptionExpired')
    expect(result).toHaveProperty('updateSubscribeStatus')
  })

  it('isSubscriptionExpired 默认 ref(true)', () => {
    const { isSubscriptionExpired } = useUserSubscribe()
    expect(isSubscriptionExpired.value).toBe(true)
  })

  it('checkSubscriptionExpired() 占位实现总返 false', () => {
    const { checkSubscriptionExpired } = useUserSubscribe()
    expect(checkSubscriptionExpired()).toBe(false)
  })

  it('updateSubscribeStatus(user) 调 checkUserSubscribedIsExpired 后写 isSubscriptionExpired（占位实现 → false）', () => {
    const { isSubscriptionExpired, updateSubscribeStatus } = useUserSubscribe()
    expect(isSubscriptionExpired.value).toBe(true)
    updateSubscribeStatus(baseUser)
    // checkUserSubscribedIsExpired 占位返 false → isSubscriptionExpired.value=false
    expect(isSubscriptionExpired.value).toBe(false)
  })

  it('updateSubscribeStatus 接受 makeUser overrides', () => {
    const { isSubscriptionExpired, updateSubscribeStatus } = useUserSubscribe()
    updateSubscribeStatus(makeUser({ userId: 999, email: 'custom@example.com' }))
    expect(isSubscriptionExpired.value).toBe(false)
  })
})
