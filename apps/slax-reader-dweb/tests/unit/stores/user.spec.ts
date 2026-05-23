// user store 纯逻辑覆盖（Sprint 2.1.1）：8 个 getter 共 18 用例
// 注意 useUserStore() 初始化 state.locale 取自 useI18n()?.locale?.value（stores/user.ts:54），
// 必须 mock useI18n，否则 store 实例化会因 vue-i18n "must be called from inside a setup function" 报错。
// haveRequestToken 来自 layers/core/app/utils/request.ts 的 nuxt auto-import，
// 直接 vi.mock 模块路径拦不到 auto-import 改写后的代码（与 useAuth.spec.ts 同模式），必须用 mockNuxtImport。
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useUserStore } from '~~/layers/core/app/stores/user'
import { baseUser, makeUser } from '~~/tests/fixtures/user'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted：mock factory 在 hoist 后早于顶层变量初始化执行，必须显式包装
// mockNuxtImport 是 macro，被 transform 成 vi.mock 后由 vitest hoist 到 import 之前，因此
// useUserStore 即便在源码里写在顶部，运行时也能拿到下面 mockNuxtImport 注入的 haveRequestToken / useI18n
const { haveRequestTokenMock, useI18nMock } = vi.hoisted(() => ({
  haveRequestTokenMock: vi.fn(() => false),
  useI18nMock: vi.fn(() => ({ locale: { value: 'en' } }))
}))
mockNuxtImport('haveRequestToken', () => haveRequestTokenMock)
mockNuxtImport('useI18n', () => useI18nMock)

describe('useUserStore - getters', () => {
  beforeEach(() => {
    // 每个用例重建 pinia，确保 state 隔离干净
    setActivePinia(createPinia())
    haveRequestTokenMock.mockReset().mockReturnValue(false)
    useI18nMock.mockReset().mockReturnValue({ locale: { value: 'en' } })
    // 锁时间，避免 isJustPaid / canRequetPushPermission 受系统时间漂移影响
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('userInfo', () => {
    it('user=null 返回 null', () => {
      const store = useUserStore()
      expect(store.userInfo).toBeNull()
    })

    it('user 已设置时返回 user 对象', () => {
      const store = useUserStore()
      store.user = baseUser
      expect(store.userInfo).toEqual(baseUser)
    })
  })

  describe('currentLocale', () => {
    it('locale 为空字符串时 fallback "en"', () => {
      const store = useUserStore()
      // 手动覆盖到空串，触发 `state.locale || 'en'` 的 fallback 分支
      store.locale = ''
      expect(store.currentLocale).toBe('en')
    })

    it('locale 已设置时返回原值', () => {
      const store = useUserStore()
      store.locale = 'zh'
      expect(store.currentLocale).toBe('zh')
    })
  })

  describe('isJustPaid', () => {
    it('payTimeRecord=null → false', () => {
      const store = useUserStore()
      expect(store.isJustPaid).toBe(false)
    })

    it('距 now < 10 分钟 → true', () => {
      const store = useUserStore()
      // 5 分钟前付费，落在 < 10 分钟窗口内
      store.payTimeRecord = Date.now() - 1000 * 60 * 5
      expect(store.isJustPaid).toBe(true)
    })

    it('距 now > 10 分钟 → false', () => {
      const store = useUserStore()
      // 15 分钟前付费，超出窗口
      store.payTimeRecord = Date.now() - 1000 * 60 * 15
      expect(store.isJustPaid).toBe(false)
    })
  })

  describe('isSubscriptionExpired', () => {
    it('user=null → true', () => {
      const store = useUserStore()
      expect(store.isSubscriptionExpired).toBe(true)
    })

    it('user 已设置 → 调 checkUserSubscribedIsExpired 并原样返回 false', () => {
      const store = useUserStore()
      // checkUserSubscribedIsExpired（utils/userRelative.ts:3）当前 stub 永远返回 false，
      // 用例锁住"调用并原样返出"行为，未来内部有逻辑会自然反映新结果
      store.user = makeUser()
      expect(store.isSubscriptionExpired).toBe(false)
    })
  })

  describe('isLogin', () => {
    it('haveRequestToken=true → true', () => {
      haveRequestTokenMock.mockReturnValue(true)
      const store = useUserStore()
      expect(store.isLogin).toBe(true)
    })

    it('haveRequestToken=false → false', () => {
      haveRequestTokenMock.mockReturnValue(false)
      const store = useUserStore()
      expect(store.isLogin).toBe(false)
    })
  })

  describe('showCloseInstallExtTips', () => {
    it('lastCloseInstallExtTipsDates 长度 0 → { canShow: true, showedAlready: false }', () => {
      const store = useUserStore()
      // 默认 state 已是 []
      expect(store.showCloseInstallExtTips).toEqual({ canShow: true, showedAlready: false })
    })

    it('长度 1 边界 → { canShow: true, showedAlready: true }', () => {
      const store = useUserStore()
      store.lastCloseInstallExtTipsDates = [Date.now()]
      // 源码：canShow = length<=1（长度 1 仍 true）；showedAlready = length>0（长度 1 为 true）
      expect(store.showCloseInstallExtTips).toEqual({ canShow: true, showedAlready: true })
    })

    it('长度 2 → { canShow: false, showedAlready: true }', () => {
      const store = useUserStore()
      store.lastCloseInstallExtTipsDates = [Date.now(), Date.now()]
      expect(store.showCloseInstallExtTips).toEqual({ canShow: false, showedAlready: true })
    })
  })

  describe('showShareTips', () => {
    it('shareTipsClicked=false → true；=true → false（断言取反语义）', () => {
      const store = useUserStore()
      // 默认 shareTipsClicked=false → showShareTips=true
      expect(store.showShareTips).toBe(true)
      store.shareTipsClicked = true
      expect(store.showShareTips).toBe(false)
    })
  })

  describe('canRequetPushPermission', () => {
    it('lastRequestPushPermissionDate=0 → true（短路）', () => {
      const store = useUserStore()
      // 默认 state 已是 0，命中 `=== 0` 短路分支
      expect(store.canRequetPushPermission).toBe(true)
    })

    it('date≠0 + 距 now ≤ 1h → false', () => {
      const store = useUserStore()
      // 30 分钟前请求过，落在 1 小时窗口内
      store.lastRequestPushPermissionDate = Date.now() - 1000 * 60 * 30
      expect(store.canRequetPushPermission).toBe(false)
    })

    it('date≠0 + 距 now > 1h → true', () => {
      const store = useUserStore()
      // 90 分钟前请求过，超出 1 小时窗口
      store.lastRequestPushPermissionDate = Date.now() - 1000 * 60 * 90
      expect(store.canRequetPushPermission).toBe(true)
    })
  })
})

// vitest 的 describe 不会跨并列块继承 beforeEach，下面两个 describe 必须各自重写一遍 setup
describe('useUserStore - 纯本地 state actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    haveRequestTokenMock.mockReset().mockReturnValue(false)
    useI18nMock.mockReset().mockReturnValue({ locale: { value: 'en' } })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('clearUserInfo', () => {
    it('user 设为 null', async () => {
      const store = useUserStore()
      store.user = baseUser
      await store.clearUserInfo()
      expect(store.user).toBeNull()
    })
  })

  describe('updatePayTimeRecord', () => {
    it('payTimeRecord 设为 Date.now()', () => {
      const store = useUserStore()
      // useFakeTimers 锁住后 Date.now() 是稳定值，可精确等于
      const expected = Date.now()
      store.updatePayTimeRecord()
      expect(store.payTimeRecord).toBe(expected)
    })
  })

  describe('clearPayTimeRecord', () => {
    it('payTimeRecord 设为 null', () => {
      const store = useUserStore()
      store.payTimeRecord = Date.now()
      store.clearPayTimeRecord()
      expect(store.payTimeRecord).toBeNull()
    })
  })

  describe('updateCloseInstallExtTipsDate', () => {
    it('append Date.now() 到 lastCloseInstallExtTipsDates', () => {
      const store = useUserStore()
      // 1 小时前已有一次记录，本次 append 形成 [before, now]
      const before = Date.now() - 1000 * 60 * 60
      store.lastCloseInstallExtTipsDates = [before]
      store.updateCloseInstallExtTipsDate()
      expect(store.lastCloseInstallExtTipsDates).toEqual([before, Date.now()])
    })
  })

  describe('updateShareTipsClicked', () => {
    it('shareTipsClicked 设为 true', () => {
      const store = useUserStore()
      // 默认初值为 false，调用后翻转
      expect(store.shareTipsClicked).toBe(false)
      store.updateShareTipsClicked()
      expect(store.shareTipsClicked).toBe(true)
    })
  })

  describe('updateLastRequestPushPermissionDate', () => {
    it('lastRequestPushPermissionDate 设为 Date.now()', () => {
      const store = useUserStore()
      const expected = Date.now()
      store.updateLastRequestPushPermissionDate()
      expect(store.lastRequestPushPermissionDate).toBe(expected)
    })
  })
})

describe('useUserStore - subscribe 相关 actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    haveRequestTokenMock.mockReset().mockReturnValue(false)
    useI18nMock.mockReset().mockReturnValue({ locale: { value: 'en' } })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getSubscribeCollectionTimeRecord', () => {
    it('subscribeCollectionTimeRecord=null → 返回 null', () => {
      const store = useUserStore()
      // 默认 state.subscribeCollectionTimeRecord 已是 null，命中前置短路
      expect(store.getSubscribeCollectionTimeRecord('any-code')).toBeNull()
    })

    it('collectionCode 不存在 → 返回 null', () => {
      const store = useUserStore()
      store.subscribeCollectionTimeRecord = {
        'other-code': { time: Date.now(), subscribed: true, cancelled: false, deleted: false }
      }
      expect(store.getSubscribeCollectionTimeRecord('any-code')).toBeNull()
    })

    it('collectionCode 存在 → 返回 { subscribed, cancelled, deleted }（不含 time）', () => {
      const store = useUserStore()
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now(), subscribed: true, cancelled: false, deleted: false }
      }
      // 源码 line 191-195 显式只投出三字段，time 不外泄
      expect(store.getSubscribeCollectionTimeRecord('col-1')).toEqual({
        subscribed: true,
        cancelled: false,
        deleted: false
      })
    })
  })

  describe('isJustSubscribeCollection', () => {
    it('subscribeCollectionTimeRecord=null → false', () => {
      const store = useUserStore()
      expect(store.isJustSubscribeCollection('any-code', { subscribed: true, cancelled: false, deleted: false })).toBe(false)
    })

    it('collectionCode 不存在 → false', () => {
      const store = useUserStore()
      store.subscribeCollectionTimeRecord = {
        'other-code': { time: Date.now(), subscribed: true, cancelled: false, deleted: false }
      }
      expect(store.isJustSubscribeCollection('any-code', { subscribed: true, cancelled: false, deleted: false })).toBe(false)
    })

    it('状态一致 + 距 now < 10 分钟 → true', () => {
      const store = useUserStore()
      // 5 分钟前订阅，三字段一致 → 落在 10 分钟窗口内
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now() - 1000 * 60 * 5, subscribed: true, cancelled: false, deleted: false }
      }
      expect(store.isJustSubscribeCollection('col-1', { subscribed: true, cancelled: false, deleted: false })).toBe(true)
    })

    it('状态不一致（subscribed 字段不同）→ false', () => {
      const store = useUserStore()
      // 时间在窗口内，但 subscribed 字段不一致 → 命中 line 202 的状态变更分支
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now() - 1000 * 60 * 5, subscribed: true, cancelled: false, deleted: false }
      }
      expect(store.isJustSubscribeCollection('col-1', { subscribed: false, cancelled: false, deleted: false })).toBe(false)
    })

    it('状态一致 + 距 now > 10 分钟 → false', () => {
      const store = useUserStore()
      // 15 分钟前订阅，三字段一致但超窗
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now() - 1000 * 60 * 15, subscribed: true, cancelled: false, deleted: false }
      }
      expect(store.isJustSubscribeCollection('col-1', { subscribed: true, cancelled: false, deleted: false })).toBe(false)
    })
  })

  describe('updateSubscribeCollectionTimeRecord', () => {
    it('record=null 时初始化 + 写入；同 key 后续写入覆盖时间和状态', () => {
      const store = useUserStore()
      // 初次：record 为 null → 内部先 `this.subscribeCollectionTimeRecord = {}` 再写入
      store.updateSubscribeCollectionTimeRecord('col-1', { subscribed: true, cancelled: false, deleted: false })
      expect(store.subscribeCollectionTimeRecord).toEqual({
        'col-1': { time: Date.now(), subscribed: true, cancelled: false, deleted: false }
      })
      // 推进 1 分钟，同 key 再写：time 与状态都被新值覆盖
      vi.advanceTimersByTime(1000 * 60)
      const newTime = Date.now()
      store.updateSubscribeCollectionTimeRecord('col-1', { subscribed: false, cancelled: true, deleted: false })
      expect(store.subscribeCollectionTimeRecord).toEqual({
        'col-1': { time: newTime, subscribed: false, cancelled: true, deleted: false }
      })
    })
  })

  describe('clearSubscribeCollectionTimeRecord', () => {
    it('record=null 时早退（不抛错、record 仍为 null）', () => {
      const store = useUserStore()
      // 默认 state.subscribeCollectionTimeRecord = null → 命中 line 221 前置 return
      expect(() => store.clearSubscribeCollectionTimeRecord('any-code')).not.toThrow()
      expect(store.subscribeCollectionTimeRecord).toBeNull()
    })

    it('删唯一 key 后整个 record 置回 null', () => {
      const store = useUserStore()
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now(), subscribed: true, cancelled: false, deleted: false }
      }
      store.clearSubscribeCollectionTimeRecord('col-1')
      // 源码 line 226-227：剩余 keys 为 0 时整体回退到 null（而非空对象）
      expect(store.subscribeCollectionTimeRecord).toBeNull()
    })

    it('删一个 key 后还有其它 key → record 保留剩余 entries', () => {
      const store = useUserStore()
      store.subscribeCollectionTimeRecord = {
        'col-1': { time: Date.now(), subscribed: true, cancelled: false, deleted: false },
        'col-2': { time: Date.now(), subscribed: false, cancelled: true, deleted: false }
      }
      store.clearSubscribeCollectionTimeRecord('col-1')
      expect(store.subscribeCollectionTimeRecord).toEqual({
        'col-2': { time: Date.now(), subscribed: false, cancelled: true, deleted: false }
      })
    })
  })
})
