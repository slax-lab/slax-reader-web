// QuickStart 组件单测
// 静态展示组件 + 一个 install 按钮 → window.open
import QuickStart from '~~/layers/core/app/components/QuickStart.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('QuickStart', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('渲染 .quick-start 容器 + .guide-section + .demo-section + .action-section', () => {
    const wrapper = mountWithApp(QuickStart)
    expect(wrapper.find('.quick-start').exists()).toBe(true)
    expect(wrapper.find('.guide-section').exists()).toBe(true)
    expect(wrapper.find('.demo-section').exists()).toBe(true)
    expect(wrapper.find('.action-section').exists()).toBe(true)
  })

  it('渲染 3 步骤 .step', () => {
    const wrapper = mountWithApp(QuickStart)
    expect(wrapper.findAll('.step').length).toBe(3)
  })

  it('demo-frame 内渲染 video 元素', () => {
    const wrapper = mountWithApp(QuickStart)
    const video = wrapper.find('.demo-frame video')
    expect(video.exists()).toBe(true)
    expect(video.attributes('src')).toContain('operating-instructions.mp4')
  })

  it('install-button 含 chrome-store url 链接（间接：getLink 链接 href）', () => {
    const wrapper = mountWithApp(QuickStart)
    const a = wrapper.find('.guide-section a.link')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toContain('chromewebstore.google.com')
  })

  it('install-button click → window.open(pluginUrl)', async () => {
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)
    const wrapper = mountWithApp(QuickStart)
    await wrapper.find('.install-button').trigger('click')
    expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('chromewebstore.google.com'))
  })
})
