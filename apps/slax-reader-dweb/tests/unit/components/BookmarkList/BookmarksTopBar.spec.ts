// BookmarksTopBar 组件单测
// 关注点：侧栏折叠按钮 .topbar-menu 与 useSidebarCollapsed 单例联动
// 子组件（搜索框 / 通知 / 用户菜单）依赖 store 与网络，这里 stub 掉
import BookmarksTopBar from '~~/layers/core/app/components/BookmarkList/BookmarksTopBar.vue'

import { useSidebarCollapsed } from '~~/layers/core/app/composables/bookmark/useSidebarCollapsed'
import { mountWithApp } from '~~/tests/setup/mount'
import { beforeEach, describe, expect, it } from 'vitest'

const mountTopBar = (props: Record<string, unknown> = {}) =>
  mountWithApp(BookmarksTopBar, {
    props,
    global: {
      stubs: {
        BookmarksSearchBar: true,
        UserNotification: true,
        BookmarksUserMenu: true,
        ThemeSwitcher: true,
        ClientOnly: { template: '<div><slot /></div>' }
      }
    }
  })

describe('BookmarksTopBar', () => {
  beforeEach(() => {
    localStorage.clear()
    useSidebarCollapsed().collapsed.value = false
  })

  it('渲染 .topbar-menu 折叠按钮，展开态 aria-expanded=true + title 为 Collapse sidebar', () => {
    const wrapper = mountTopBar()
    const btn = wrapper.find('.topbar-menu')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(btn.attributes('title')).toBe('Collapse sidebar')
  })

  it('点击 .topbar-menu → collapsed 翻转，aria-expanded=false，title 变为 Expand sidebar', async () => {
    const wrapper = mountTopBar()
    const { collapsed } = useSidebarCollapsed()
    await wrapper.find('.topbar-menu').trigger('click')
    expect(collapsed.value).toBe(true)
    const btn = wrapper.find('.topbar-menu')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('title')).toBe('Expand sidebar')
  })

  it('sidebar-toggle=false 时不渲染 .topbar-menu，logo 仍在', () => {
    const wrapper = mountTopBar({ sidebarToggle: false })
    expect(wrapper.find('.topbar-menu').exists()).toBe(false)
    expect(wrapper.find('.topbar-logo').exists()).toBe(true)
  })

  it('.topbar-menu 位于 logo 之前', () => {
    const wrapper = mountTopBar()
    const left = wrapper.find('.topbar-left')
    const children = left.element.children
    expect(children[0]!.classList.contains('topbar-menu')).toBe(true)
    expect(children[1]!.classList.contains('topbar-logo')).toBe(true)
  })
})
