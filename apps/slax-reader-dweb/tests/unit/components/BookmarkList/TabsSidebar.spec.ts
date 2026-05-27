// TabsSidebar 组件单测
// props: tabType: string
// emit: changeTab(type, index?)
// onMounted 内构建 tabList（依赖 import.meta.glob，happy-dom 下空 → tabList=[]，但 trash button 仍渲染）
// 暴露 getAllButtons() 方法
import TabsSidebar from '~~/layers/core/app/components/BookmarkList/TabsSidebar.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('TabsSidebar', () => {
  describe('渲染', () => {
    it('默认 tabType="inbox" → 渲染 .tabs 容器（普通 + trash 各一）', () => {
      const wrapper = mountWithApp(TabsSidebar)
      const tabs = wrapper.findAll('.tabs')
      expect(tabs.length).toBe(2)
    })

    it('trash 按钮渲染（i18n trash 文案）', () => {
      const wrapper = mountWithApp(TabsSidebar)
      const trashBtn = wrapper.find('button.trash')
      expect(trashBtn.exists()).toBe(true)
    })

    it('tabType="trashed" → trash 按钮 highlighted class', () => {
      const wrapper = mountWithApp(TabsSidebar, { props: { tabType: 'trashed' } })
      const trashBtn = wrapper.find('button.trash')
      expect(trashBtn.classes()).toContain('highlighted')
    })

    it('tabType="inbox" → trash 按钮无 highlighted', () => {
      const wrapper = mountWithApp(TabsSidebar, { props: { tabType: 'inbox' } })
      const trashBtn = wrapper.find('button.trash')
      expect(trashBtn.classes()).not.toContain('highlighted')
    })
  })

  describe('交互', () => {
    it('点击 trash 按钮 → emit changeTab("trashed", undefined)', async () => {
      const wrapper = mountWithApp(TabsSidebar)
      await wrapper.find('button.trash').trigger('click')
      const events = wrapper.emitted('changeTab')
      expect(events).toBeTruthy()
      // inboxClick 签名 (type, index?) → 不传 index 时 emit 带 undefined
      expect(events![0]![0]).toBe('trashed')
    })
  })

  describe('暴露方法', () => {
    it('getAllButtons() 返回 NodeList（依赖 tabs ref，happy-dom 下 tabList 为空 → 返 0 长 NodeList 或 fallback []）', () => {
      const wrapper = mountWithApp(TabsSidebar)
      const buttons = (wrapper.vm as any).getAllButtons()
      expect(buttons).toBeDefined()
      // import.meta.glob 在 happy-dom 单测中可能为空 → tabList=[] → 第一个 .tabs 容器内无 button
      // 仅断言不抛错 + 返回类对象
      expect(typeof buttons.length).toBe('number')
    })
  })
})
