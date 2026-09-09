// pages/user.vue 单测
// 覆盖：加载态骨架屏 / 内容态卡片结构 / 实验室卡片按 /labs 返回显隐 / 返回按钮 / error_alert query 处理
import UserRelatedInfoSection from '~~/layers/core/app/components/global/UserRelatedInfoSection.vue'
import UserImportSection from '~~/layers/core/app/components/UserImportSection.vue'
import UserPage from '~~/layers/core/app/pages/user.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRoute, mockNavigateTo, mockRequest, mockGet, mockAnalyticsLog, mockToastShowToast, mockUseI18n } = vi.hoisted(() => {
  const route = { query: {} as Record<string, unknown>, path: '/user', params: {}, fullPath: '/user' }
  const mockGet = vi.fn()
  const mockT = vi.fn((key: string) => key)
  return {
    mockRoute: route,
    mockNavigateTo: vi.fn(() => Promise.resolve()),
    mockRequest: vi.fn(() => ({ get: mockGet, post: vi.fn(() => Promise.resolve()) })),
    mockGet,
    mockAnalyticsLog: vi.fn(),
    mockToastShowToast: vi.fn(),
    mockUseI18n: vi.fn(() => ({ locale: { value: 'en' }, t: mockT, te: () => true }))
  }
})

vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast: mockToastShowToast },
  ToastType: { Success: 1, Error: 2, Warning: 3, Info: 4 }
}))

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('request', () => mockRequest)
mockNuxtImport('analyticsLog', () => mockAnalyticsLog)
mockNuxtImport('useI18n', () => mockUseI18n)

const baseUserDetail = {
  name: 'Test User',
  email: 'test@example.com',
  account: 'testaccount',
  lang: 'en',
  avatar: 'https://example.com/avatar.jpg',
  timezone: 'UTC',
  id: '1',
  platform: [],
  subscription: {},
  share_collect: {},
  stripe_connect: {},
  ai_lang: 'en'
}

// request().get 按 url 分发：/v1/user/labs 默认返回空列表，其余返回用户详情
let labFeatures: unknown[] = []
const dispatchGet = ({ url }: { url: string }) => Promise.resolve(url === '/v1/user/labs' ? { features: labFeatures } : baseUserDetail)

beforeEach(() => {
  mockRoute.query = {}
  mockNavigateTo.mockClear()
  mockGet.mockReset()
  mockAnalyticsLog.mockClear()
  mockToastShowToast.mockClear()
  labFeatures = []
  mockGet.mockImplementation(dispatchGet)
})

afterEach(() => {
  mockRoute.query = {}
})

// 子组件 stub，避免子组件内部副作用
const stubs = {
  UserRelatedInfoSection: {
    name: 'UserRelatedInfoSection',
    template: '<section class="settings-card user-related-stub"></section>',
    props: ['userInfo'],
    emits: ['update']
  },
  UserImportSection: {
    name: 'UserImportSection',
    template: '<section class="settings-card user-import-stub"></section>'
  },
  UserExportSection: {
    name: 'UserExportSection',
    template: '<section class="settings-card user-export-stub"></section>'
  },
  UserDeleteAccountSection: {
    name: 'UserDeleteAccountSection',
    template: '<section class="user-delete-account-section"></section>'
  },
  OptionsBar: {
    name: 'OptionsBar',
    template: '<div class="options-bar-stub"></div>',
    props: ['options', 'defaultSelectedIndex'],
    emits: ['optionSelected']
  },
  AILanguageTips: {
    name: 'AILanguageTips',
    template: '<span />'
  },
  NavigateStyleButton: {
    name: 'NavigateStyleButton',
    template: '<button class="navigate-style-button-stub"></button>',
    props: ['title'],
    emits: ['action']
  }
}

describe('pages/user', () => {
  describe('加载态', () => {
    it('loading=true 时渲染 UserPageSkeleton，不渲染 .detail', () => {
      mockGet.mockReturnValue(new Promise(() => {})) // 永不 resolve
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      expect(wrapper.find('.user-page-skeleton').exists()).toBe(true)
      expect(wrapper.find('.detail').exists()).toBe(false)
    })
  })

  describe('内容态', () => {
    it('加载完成后渲染 .detail + .user-topbar', async () => {
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      expect(wrapper.find('.detail').exists()).toBe(true)
      expect(wrapper.find('.user-topbar').exists()).toBe(true)
    })

    it('渲染 6 个 .settings-card（语言 + 个人信息 + 第三方绑定 + 导入 + 导出 + 帮助支持），实验室为空时不占卡', async () => {
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      expect(wrapper.findAll('.settings-card').length).toBe(6)
      expect(wrapper.find('#labs').exists()).toBe(false)
    })

    it('/labs 返回一个功能 → 第 7 张卡是实验室，放在语言卡片后面', async () => {
      labFeatures = [{ key: 'youtube', status: 'active', enabled: false, enabled_at: null }]
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      const cards = wrapper.findAll('.settings-card')
      expect(cards.length).toBe(7)
      expect(cards[1]!.attributes('id')).toBe('labs')
      expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ url: '/v1/user/labs' }))
    })

    it('UserRelatedInfoSection 和 UserImportSection 组件存在', async () => {
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      expect(wrapper.findComponent(UserRelatedInfoSection).exists()).toBe(true)
      expect(wrapper.findComponent(UserImportSection).exists()).toBe(true)
    })

    it('UserDeleteAccountSection 不含 .settings-card class', async () => {
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      const deleteSection = wrapper.find('.user-delete-account-section')
      expect(deleteSection.exists()).toBe(true)
      expect(deleteSection.classes()).not.toContain('settings-card')
    })
  })

  describe('返回按钮', () => {
    it('点击 .back-btn 触发 navigateTo("/bookmarks", { replace: true })', async () => {
      const wrapper = mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      await wrapper.find('.back-btn').trigger('click')
      expect(mockNavigateTo).toHaveBeenCalledWith('/bookmarks', { replace: true })
    })
  })

  describe('error_alert query 参数', () => {
    it('存在 error_alert 时调用 Toast.showToast 并 navigateTo 清除参数', async () => {
      mockRoute.query = { error_alert: '登录已过期', other: 'keep' }
      mountWithApp(UserPage, { global: { stubs } })
      await flushPromises()
      expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ text: '登录已过期' }))
      expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/user', query: { other: 'keep' } }, { replace: true })
    })
  })
})
