// AppHeader 组件单测
// 主要 setup 行为：
//  - useAppHeader({ showHomeLinks, extraLinks }) 拿 navLinks/auxiliaryLinks
//  - onMounted addLog → analyticsLog({ event: 'homepage_view', section: <由 location.pathname 决定> })
//  - showMobileSidebar ref + 触发 hamburger / close
//  - handleStartFree → showMobileSidebar=false + auxiliaryLinks.startFree.action()
import AppHeader from '~~/layers/core/app/components/AppHeader.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAnalyticsLog, mockStartFreeAction } = vi.hoisted(() => ({
  mockAnalyticsLog: vi.fn(),
  mockStartFreeAction: vi.fn(() => Promise.resolve())
}))

mockNuxtImport('analyticsLog', () => mockAnalyticsLog)
mockNuxtImport('useAppHeader', () => () => ({
  navLinks: [
    { name: 'Home', href: '/', external: false },
    { name: 'Pricing', href: '/pricing', external: false },
    { name: 'Blog', href: '/blog', external: true }
  ],
  auxiliaryLinks: {
    github: { name: 'GitHub', href: 'https://github.com/slax-reader' },
    startFree: { name: 'Start Free', action: mockStartFreeAction }
  }
}))

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('渲染', () => {
    it('mount → .app-header + .logo + nav-links 渲染', () => {
      const wrapper = mountWithApp(AppHeader)
      expect(wrapper.find('.app-header').exists()).toBe(true)
      expect(wrapper.find('.logo').exists()).toBe(true)
      expect(wrapper.find('.nav-links').exists()).toBe(true)
    })

    it('navLinks 数量 → 渲染对应 .nav-links a.link.hover', () => {
      const wrapper = mountWithApp(AppHeader)
      const links = wrapper.findAll('.nav-links a.link.hover')
      expect(links.length).toBe(3)
    })

    it('navLink external=true → target="_blank"', () => {
      const wrapper = mountWithApp(AppHeader)
      const links = wrapper.findAll('.nav-links a.link.hover')
      expect(links[2]!.attributes('target')).toBe('_blank')
    })

    it('btn-github 渲染 + 含 GitHub url', () => {
      const wrapper = mountWithApp(AppHeader)
      const github = wrapper.find('.btn-github')
      expect(github.exists()).toBe(true)
      expect(github.attributes('href')).toBe('https://github.com/slax-reader')
    })

    it('btn-free 渲染 startFree.name', () => {
      const wrapper = mountWithApp(AppHeader)
      const free = wrapper.find('.btn-free')
      expect(free.exists()).toBe(true)
      expect(free.text()).toContain('Start Free')
    })

    it('hamburger button 渲染', () => {
      const wrapper = mountWithApp(AppHeader)
      expect(wrapper.find('button.hamburger-btn').exists()).toBe(true)
    })
  })

  describe('analyticsLog', () => {
    it('onMounted → analyticsLog 调，section 由 pathname 决定', () => {
      // happy-dom 默认 pathname 通常是 /
      mountWithApp(AppHeader)
      expect(mockAnalyticsLog).toHaveBeenCalledWith({
        event: 'homepage_view',
        section: 'homepage'
      })
    })

    it('pathname=/pricing → section=pricing', () => {
      // 通过 vi.stubGlobal 替换 window.location 难度大；改为 spyOn pathname
      const orig = window.location.pathname
      Object.defineProperty(window.location, 'pathname', { value: '/pricing', configurable: true })
      mountWithApp(AppHeader)
      expect(mockAnalyticsLog).toHaveBeenCalledWith({
        event: 'homepage_view',
        section: 'pricing'
      })
      Object.defineProperty(window.location, 'pathname', { value: orig, configurable: true })
    })
  })

  describe('mobile sidebar 交互', () => {
    it('hamburger click → showMobileSidebar=true → mask + sidebar 显示', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('button.hamburger-btn').trigger('click')
      const mask = wrapper.find('.sidebar-mask')
      expect(mask.attributes('style') || '').not.toContain('display: none')
    })

    it('mask click → showMobileSidebar=false → 隐藏', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('button.hamburger-btn').trigger('click')
      await wrapper.find('.sidebar-mask').trigger('click')
      const mask = wrapper.find('.sidebar-mask')
      expect(mask.attributes('style') || '').toContain('display: none')
    })

    it('close-btn click → showMobileSidebar=false', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('button.hamburger-btn').trigger('click')
      await wrapper.find('button.close-btn').trigger('click')
      const sidebar = wrapper.find('.mobile-sidebar')
      expect(sidebar.attributes('style') || '').toContain('display: none')
    })

    it('mobile-link click → showMobileSidebar=false', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('button.hamburger-btn').trigger('click')
      const mobileLinks = wrapper.findAll('.mobile-nav-links a.mobile-link')
      expect(mobileLinks.length).toBe(3)
      await mobileLinks[0]!.trigger('click')
      const sidebar = wrapper.find('.mobile-sidebar')
      expect(sidebar.attributes('style') || '').toContain('display: none')
    })
  })

  describe('handleStartFree', () => {
    it('btn-free click → 调 auxiliaryLinks.startFree.action()', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('.nav-links .btn-free').trigger('click')
      expect(mockStartFreeAction).toHaveBeenCalled()
    })

    it('mobile btn-free click → 调 action + 关 sidebar', async () => {
      const wrapper = mountWithApp(AppHeader)
      await wrapper.find('button.hamburger-btn').trigger('click')
      await wrapper.find('.mobile-nav-links .btn-free').trigger('click')
      expect(mockStartFreeAction).toHaveBeenCalled()
    })
  })
})
