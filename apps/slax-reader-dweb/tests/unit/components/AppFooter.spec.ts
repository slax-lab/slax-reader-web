// AppFooter 组件单测
// 静态组件 — 仅链接 + 版权文案
import AppFooter from '~~/layers/core/app/components/AppFooter.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('AppFooter', () => {
  it('渲染 footer + .container + .footer-content', () => {
    const wrapper = mountWithApp(AppFooter)
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('.container').exists()).toBe(true)
    expect(wrapper.find('.footer-content').exists()).toBe(true)
  })

  it('footer-links 渲染 6 个 a 标签', () => {
    const wrapper = mountWithApp(AppFooter)
    const links = wrapper.findAll('.footer-links a')
    expect(links.length).toBe(6)
  })

  it('外链含 target="_blank"（Blog/Twitter/Telegram）', () => {
    const wrapper = mountWithApp(AppFooter)
    const links = wrapper.findAll('.footer-links a')
    const externalCount = links.filter(a => a.attributes('target') === '_blank').length
    expect(externalCount).toBeGreaterThanOrEqual(3)
  })

  it('内链（terms / privacy / contact）不含 target', () => {
    const wrapper = mountWithApp(AppFooter)
    const links = wrapper.findAll('.footer-links a')
    const internal = links.filter(a => !a.attributes('target'))
    expect(internal.length).toBe(3)
    const hrefs = internal.map(a => a.attributes('href'))
    expect(hrefs).toContain('/terms')
    expect(hrefs).toContain('/privacy')
    expect(hrefs).toContain('/contact')
  })

  it('版权文案渲染', () => {
    const wrapper = mountWithApp(AppFooter)
    expect(wrapper.find('.footer-copyright p').text()).toContain('Slax Reader')
  })
})
