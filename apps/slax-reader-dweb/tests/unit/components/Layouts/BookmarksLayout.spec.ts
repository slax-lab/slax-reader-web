// Layouts/BookmarksLayout 组件单测
// 静态 layout，6 个具名 slot
// expose: isSmallScreen() 基于 smallScreenTrigger.opacity
import BookmarksLayout from '~~/layers/core/app/components/Layouts/BookmarksLayout.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('Layouts/BookmarksLayout', () => {
  it('mount → 渲染 .bookmarks-layout + .header + .content', () => {
    const wrapper = mountWithApp(BookmarksLayout)
    expect(wrapper.find('.bookmarks-layout').exists()).toBe(true)
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(true)
  })

  it('app 标题渲染 i18n common.app.name', () => {
    const wrapper = mountWithApp(BookmarksLayout)
    expect(wrapper.find('.app .title').exists()).toBe(true)
    expect(wrapper.find('.app .title').text().length).toBeGreaterThan(0)
  })

  it('具名 slot operates 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: { operates: '<div class="custom-operates">Ops</div>' }
    })
    expect(wrapper.find('.custom-operates').exists()).toBe(true)
  })

  it('具名 slot top-modals 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: { 'top-modals': '<div class="custom-top">Top</div>' }
    })
    expect(wrapper.find('.custom-top').exists()).toBe(true)
  })

  it('具名 slot sidebar-left / sidebar-right 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: {
        'sidebar-left': '<div class="custom-left">L</div>',
        'sidebar-right': '<div class="custom-right">R</div>'
      }
    })
    expect(wrapper.find('.custom-left').exists()).toBe(true)
    expect(wrapper.find('.custom-right').exists()).toBe(true)
  })

  it('具名 slot content-header / content-list 渲染', () => {
    const wrapper = mountWithApp(BookmarksLayout, {
      slots: {
        'content-header': '<div class="custom-header">H</div>',
        'content-list': '<div class="custom-list">List</div>'
      }
    })
    expect(wrapper.find('.custom-header').exists()).toBe(true)
    expect(wrapper.find('.custom-list').exists()).toBe(true)
  })

  it('暴露 isSmallScreen() 基于 trigger opacity（happy-dom 默认 opacity 不为 1）', () => {
    const wrapper = mountWithApp(BookmarksLayout)
    expect((wrapper.vm as any).isSmallScreen()).toBe(false)
  })
})
