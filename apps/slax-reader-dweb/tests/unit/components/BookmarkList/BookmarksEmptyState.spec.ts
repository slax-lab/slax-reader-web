// BookmarksEmptyState 组件单测
// inboxState 由父级（页面层的 useInboxOnboardingState）算好传入，本组件只负责渲染：
// B（未装插件+有订阅）→ 带按钮的 EmptyView；C（已装插件）/null/非 inbox tab → 纯净 EmptyView。
// A 由页面层直接渲染 BookmarksOnboardingHero 接管，不会经过本组件。
import BookmarksEmptyState from '~~/layers/core/app/components/BookmarkList/BookmarksEmptyState.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, describe, expect, it, vi } from 'vitest'

const baseProps = {
  filterStatus: 'inbox',
  isCurrentInboxTab: true
}

describe('BookmarksEmptyState', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('inbox：B/C/null', () => {
    it('inboxState=null（未就位）→ 不渲染任何态', () => {
      const wrapper = mountWithApp(BookmarksEmptyState, { props: { ...baseProps, inboxState: null } })
      expect(wrapper.find('.empty-view').exists()).toBe(false)
    })

    it('inboxState=B → 渲染带按钮 + 图标的 EmptyView（非默认兜底圆圈图标）', () => {
      const wrapper = mountWithApp(BookmarksEmptyState, { props: { ...baseProps, inboxState: 'B' } })
      expect(wrapper.find('.empty-view').exists()).toBe(true)
      expect(wrapper.find('.empty-view-action').exists()).toBe(true)
      // 必须带 inbox 专属图标，而不是 BookmarksEmptyView 默认的兜底圆圈（<circle>）
      const iconSvg = wrapper.find('.empty-view-icon svg')
      expect(iconSvg.exists()).toBe(true)
      expect(iconSvg.find('circle').exists()).toBe(false)
    })

    it('inboxState=B：点击安装按钮 → window.open(pluginUrl)', async () => {
      const mockOpen = vi.fn()
      vi.stubGlobal('open', mockOpen)
      const wrapper = mountWithApp(BookmarksEmptyState, { props: { ...baseProps, inboxState: 'B' } })
      await wrapper.find('.empty-view-action').trigger('click')
      expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('chromewebstore.google.com'))
    })

    it('inboxState=C → 渲染无按钮的纯净 EmptyView', () => {
      const wrapper = mountWithApp(BookmarksEmptyState, { props: { ...baseProps, inboxState: 'C' } })
      expect(wrapper.find('.empty-view').exists()).toBe(true)
      expect(wrapper.find('.empty-view-action').exists()).toBe(false)
    })
  })

  describe('非 inbox tab', () => {
    it('trashed 空态 → 走通用 BOOKMARK_EMPTY_CONFIG，不受三态逻辑影响', () => {
      const wrapper = mountWithApp(BookmarksEmptyState, {
        props: { filterStatus: 'trashed', isCurrentInboxTab: false, inboxState: null }
      })
      expect(wrapper.find('.empty-view').exists()).toBe(true)
      expect(wrapper.find('.empty-view-action').exists()).toBe(false)
    })
  })
})
