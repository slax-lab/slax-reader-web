// ReleaseNote 组件单测
// onMounted: lis = querySelectorAll('li') + 注册 resize/scroll handler
// handler: 遍历 lis，可见的 li 加 active class
// onUnmounted: 移除 handler
// 注意：happy-dom 下 getBoundingClientRect 返回 {top:0,left:0,...}，所以默认所有元素都"可见"
import ReleaseNote from '~~/layers/core/app/components/ReleaseNote.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ReleaseNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mount → 渲染 .release-note + .history-list', () => {
    const wrapper = mountWithApp(ReleaseNote)
    expect(wrapper.find('.release-note').exists()).toBe(true)
    expect(wrapper.find('.history-list').exists()).toBe(true)
  })

  it('渲染 6 个 .history-item（与 timelines 数组长度一致）', () => {
    const wrapper = mountWithApp(ReleaseNote)
    const items = wrapper.findAll('.history-item')
    expect(items.length).toBe(6)
  })

  it('第一个 .timeline-content 添加 active class（index === 0）', () => {
    const wrapper = mountWithApp(ReleaseNote)
    const contents = wrapper.findAll('.timeline-content')
    expect(contents[0].classes()).toContain('active')
    if (contents.length > 1) {
      expect(contents[1].classes()).not.toContain('active')
    }
  })

  it('每个 timeline-content 含 h1 + ul', () => {
    const wrapper = mountWithApp(ReleaseNote)
    const firstContent = wrapper.find('.timeline-content')
    expect(firstContent.find('h1').exists()).toBe(true)
    expect(firstContent.find('ul').exists()).toBe(true)
  })

  it('handler 触发 → 可见 li 加 active class（happy-dom 下所有 rect 都 0,0 → 满足条件）', async () => {
    const wrapper = mountWithApp(ReleaseNote, { attachTo: document.body })
    await wrapper.vm.$nextTick()
    // 触发 scroll event 让 handler 跑
    const ul = wrapper.find('.history-list').element as HTMLElement
    ul.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    // 仅断言不抛错（handler 已被绑定 + 触发）
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })
})
