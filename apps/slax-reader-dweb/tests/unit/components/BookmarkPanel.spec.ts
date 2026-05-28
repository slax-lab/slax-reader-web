// BookmarkPanel 组件行为驱动测试
// 注意：FEEDBACK 按钮源码无 aria-label/文本，按 `.feedback-wrapper button` 容器选择器定位
// 注意：AI 按钮位于 .panel-wrapper.pro 内，该容器受 CHATBOT v-if 控制，测试 AI 需同时传入 CHATBOT
import BookmarkPanel, { BookmarkPanelType } from '~~/layers/core/app/components/BookmarkPanel.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('BookmarkPanel', () => {
  describe('渲染', () => {
    it('types=[CHATBOT] 渲染 chat 按钮（按 i18n 文案 "Chat" 断言）', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.CHATBOT] }
      })
      expect(wrapper.find('.panel-wrapper.pro').exists()).toBe(true)
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(1)
      // page.bookmarks_detail.chat = "Chat"
      expect(buttons[0]!.text()).toContain('Chat')
    })

    it('types=[ARCHIVE, TOP] 渲染两个按钮且文案分别含 "Archive" / "Top"', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.ARCHIVE, BookmarkPanelType.TOP] }
      })
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(2)
      const texts = buttons.map(b => b.text())
      // common.operate.archive = "Archive"
      expect(texts.some(t => t.includes('Archive'))).toBe(true)
      // common.operate.top = "Top"
      expect(texts.some(t => t.includes('Top'))).toBe(true)
    })

    it('types 含 FEEDBACK 时 .feedback-wrapper 内 button 渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.FEEDBACK] }
      })
      const feedbackBtn = wrapper.find('.feedback-wrapper button')
      expect(feedbackBtn.exists()).toBe(true)
    })

    it('types 不含 FEEDBACK 时 .feedback-wrapper 整个不渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.ARCHIVE] }
      })
      expect(wrapper.find('.feedback-wrapper').exists()).toBe(false)
    })

    it('types 不含 CHATBOT / AI 时 .panel-wrapper.pro 不渲染', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.TOP] }
      })
      expect(wrapper.find('.panel-wrapper.pro').exists()).toBe(false)
    })
  })

  describe('边界', () => {
    it('types=[] 时不渲染任何 button 和 .item', () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [] }
      })
      expect(wrapper.findAll('button').length).toBe(0)
      expect(wrapper.findAll('.item').length).toBe(0)
      // 注意：普通 .panel-wrapper 容器无 v-if，仍渲染；不断言 .panel-wrapper 不存在
    })
  })

  describe('交互', () => {
    it.each([[BookmarkPanelType.CHATBOT], [BookmarkPanelType.ARCHIVE], [BookmarkPanelType.UNARCHIVE], [BookmarkPanelType.TOP]])(
      '点击 %s 按钮 emit panelClick 且 payload 等于该 type',
      async type => {
        const wrapper = mountWithApp(BookmarkPanel, {
          props: { types: [type] }
        })
        await wrapper.find('button').trigger('click')
        const emits = wrapper.emitted('panelClick')
        expect(emits).not.toBeUndefined()
        expect(emits![0]).toEqual([type])
      }
    )

    it('点击 AI 按钮 emit panelClick 且 payload 为 AI（需同时传入 CHATBOT 使父容器渲染）', async () => {
      // .panel-wrapper.pro 的 v-if 绑定 CHATBOT，AI 按钮在其内部，必须同时传入 CHATBOT
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.CHATBOT, BookmarkPanelType.AI] }
      })
      // page.bookmarks_detail.ai_analyze = "Analysis"，CHATBOT 按钮文案为 "Chat"
      const buttons = wrapper.findAll('button')
      const aiButton = buttons.find(b => b.text().includes('Analysis'))
      expect(aiButton).toBeDefined()
      await aiButton!.trigger('click')
      const emits = wrapper.emitted('panelClick')
      expect(emits).not.toBeUndefined()
      const aiEmit = emits!.find(e => e[0] === BookmarkPanelType.AI)
      expect(aiEmit).toBeDefined()
    })

    it('点击 FEEDBACK 按钮 emit panelClick 且 payload 为 FEEDBACK', async () => {
      const wrapper = mountWithApp(BookmarkPanel, {
        props: { types: [BookmarkPanelType.FEEDBACK] }
      })
      await wrapper.find('.feedback-wrapper button').trigger('click')
      const emits = wrapper.emitted('panelClick')
      expect(emits).not.toBeUndefined()
      expect(emits![0]).toEqual([BookmarkPanelType.FEEDBACK])
    })
  })
})
