import { checkUserSubscribedIsExpired } from '~~/layers/core/app/utils/userRelative'

import type { UserInfo } from '@commons/types/interface'
import { describe, expect, it } from 'vitest'

describe('checkUserSubscribedIsExpired', () => {
  it('当前 stub 实现：传任意 UserInfo 都返回 false', () => {
    const user: UserInfo = {
      userId: 100,
      email: 'a@b.c',
      lang: 'en',
      name: 'X',
      picture: 'p',
      timezone: 'UTC'
    }
    expect(checkUserSubscribedIsExpired(user)).toBe(false)
  })
})
