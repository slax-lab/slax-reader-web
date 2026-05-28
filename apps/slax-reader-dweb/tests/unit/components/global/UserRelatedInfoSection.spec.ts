// global/UserRelatedInfoSection.vue 单测 —— 第五期 Sprint G
// 覆盖：未绑定 telegram → 渲染 NavigateStyleButton；已绑定 → 渲染 telegram p；
//      bindTelegram 成功（返回 url 调 window.open + setTimeout emit update）/ 失败（console.log error）
import UserRelatedInfoSection from '~~/layers/core/app/components/global/UserRelatedInfoSection.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPost, mockRequest } = vi.hoisted(() => {
  const mockPost = vi.fn()
  return {
    mockPost,
    mockRequest: vi.fn(() => ({ post: mockPost }))
  }
})

mockNuxtImport('request', () => mockRequest)

const stubs = {
  NavigateStyleButton: {
    name: 'NavigateStyleButton',
    props: ['title'],
    template: '<button class="navigate-style-stub" @click="$emit(\'action\')">{{ title }}</button>',
    emits: ['action']
  }
}

beforeEach(() => {
  mockPost.mockReset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('global/UserRelatedInfoSection', () => {
  it('未绑定 telegram：渲染 NavigateStyleButton', () => {
    const wrapper = mountWithApp(UserRelatedInfoSection, {
      props: { userInfo: { platform: [] } },
      global: { stubs }
    })
    expect(wrapper.find('.navigate-style-stub').exists()).toBe(true)
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('已绑定 telegram：渲染 p 显示账号', () => {
    const wrapper = mountWithApp(UserRelatedInfoSection, {
      props: {
        userInfo: { platform: [{ platform: 'telegram', user_name: 'tg_user' }] }
      },
      global: { stubs }
    })
    expect(wrapper.find('.navigate-style-stub').exists()).toBe(false)
    expect(wrapper.find('p').text()).toBe('Telegram: tg_user')
  })

  it('bindTelegram 成功：调 request().post + window.open + 10s 后 emit update', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    mockPost.mockResolvedValueOnce('https://t.me/bind?token=x')
    const wrapper = mountWithApp(UserRelatedInfoSection, {
      props: { userInfo: { platform: [] } },
      global: { stubs }
    })
    await wrapper.find('.navigate-style-stub').trigger('click')
    await flushPromises()
    expect(mockPost).toHaveBeenCalledWith({
      url: '/v1/user/bind_link',
      body: { platform: 'telegram' }
    })
    expect(openSpy).toHaveBeenCalledWith('https://t.me/bind?token=x')
    // 10s 后触发 emit update
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.emitted('update')).toHaveLength(1)
  })

  it('bindTelegram 服务端 falsy：console.log + 不调 window.open', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    mockPost.mockResolvedValueOnce(null)
    const wrapper = mountWithApp(UserRelatedInfoSection, {
      props: { userInfo: { platform: [] } },
      global: { stubs }
    })
    await wrapper.find('.navigate-style-stub').trigger('click')
    await flushPromises()
    expect(consoleSpy).toHaveBeenCalledWith('error')
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('userInfo.platform 缺失：isEnablePlaform 走 false 分支', () => {
    const wrapper = mountWithApp(UserRelatedInfoSection, {
      props: { userInfo: {} as never },
      global: { stubs }
    })
    expect(wrapper.find('.navigate-style-stub').exists()).toBe(true)
  })
})
