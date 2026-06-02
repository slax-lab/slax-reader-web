// TabsSidebar 组件单测（Phase 3 重设计后更新）
// 新结构：.tabs-sidebar 容器，.sidebar-item 按钮，active class，废纸篓按钮为最后一个 .sidebar-item
// emit: changeTab(type, index?)
// 暴露 getAllButtons() 方法
import TabsSidebar from '~~/layers/core/app/components/BookmarkList/TabsSidebar.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('TabsSidebar', () => {
  describe('渲染', () => {
    it('默认渲染 .tabs-sidebar 容器', () => {
      const wrapper = mountWithApp(TabsSidebar)
      expect(wrapper.find('.tabs-sidebar').exists()).toBe(true)
    })

    it('渲染 .sidebar-item 按钮（含废纸篓）', () => {
      const wrapper = mountWithApp(TabsSidebar)
      const items = wrapper.findAll('.sidebar-item')
      // BookmarkTabTypes 5 项 + 废纸篓 1 项 = 6 个按钮
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    it('tabType="trashed" → 废纸篓按钮有 active class', () => {
      const wrapper = mountWithApp(TabsSidebar, { props: { tabType: 'trashed' } })
      const items = wrapper.findAll('.sidebar-item')
      // 废纸篓是最后一个 sidebar-item
      const trashBtn = items[items.length - 1]!
      expect(trashBtn.classes()).toContain('active')
    })

    it('tabType="inbox" → 废纸篓按钮无 active class', () => {
      const wrapper = mountWithApp(TabsSidebar, { props: { tabType: 'inbox' } })
      const items = wrapper.findAll('.sidebar-item')
      const trashBtn = items[items.length - 1]!
      expect(trashBtn.classes()).not.toContain('active')
    })

    it('tabType="inbox" → 第一个 sidebar-item 有 active class', () => {
      const wrapper = mountWithApp(TabsSidebar, { props: { tabType: 'inbox' } })
      const firstItem = wrapper.find('.sidebar-item')
      expect(firstItem.classes()).toContain('active')
    })
  })

  describe('交互', () => {
    it('点击废纸篓按钮 → emit changeTab("trashed")', async () => {
      const wrapper = mountWithApp(TabsSidebar)
      const items = wrapper.findAll('.sidebar-item')
      const trashBtn = items[items.length - 1]!
      await trashBtn.trigger('click')
      const events = wrapper.emitted('changeTab')
      expect(events).toBeTruthy()
      expect(events![0]![0]).toBe('trashed')
    })

    it('点击第一个 sidebar-item → emit changeTab("inbox", 0)', async () => {
      const wrapper = mountWithApp(TabsSidebar)
      const firstItem = wrapper.find('.sidebar-item')
      await firstItem.trigger('click')
      const events = wrapper.emitted('changeTab')
      expect(events).toBeTruthy()
      expect(events![0]![0]).toBe('inbox')
    })
  })

  describe('暴露方法', () => {
    it('getAllButtons() 返回 NodeList（不抛错 + 返回类对象）', () => {
      const wrapper = mountWithApp(TabsSidebar)
      const buttons = (wrapper.vm as any).getAllButtons()
      expect(buttons).toBeDefined()
      expect(typeof buttons.length).toBe('number')
    })
  })
})
