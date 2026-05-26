// Tips/AILanguageTips 组件单测
// 极简：一个 button + bubble，hover 触发 isShowBubble
// 用 v-element-hover 指令；happy-dom 下不会真触发 hover state，只能验证渲染结构 + 通过 setupState 直接驱动
import AILanguageTips from '~~/layers/core/app/components/Tips/AILanguageTips.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('Tips/AILanguageTips', () => {
  it('mount → 渲染 .ai-language-tips + button + bubble-container', () => {
    const wrapper = mountWithApp(AILanguageTips)
    expect(wrapper.find('.ai-language-tips').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.bubble-container').exists()).toBe(true)
  })

  it('button 内含 img', () => {
    const wrapper = mountWithApp(AILanguageTips)
    expect(wrapper.find('button img').exists()).toBe(true)
  })

  it('默认 isShowBubble=false → bubble-container v-show 隐藏', () => {
    const wrapper = mountWithApp(AILanguageTips)
    const bubble = wrapper.find('.bubble-container')
    expect(bubble.attributes('style') || '').toContain('display: none')
  })

  it('bubble-container 内含 i18n span', () => {
    const wrapper = mountWithApp(AILanguageTips)
    expect(wrapper.find('.bubble-container span').text().length).toBeGreaterThan(0)
  })

  it('isShowBubble=true → bubble-container v-show 显示（直接驱动 setupState 模拟 hover state）', async () => {
    const wrapper = mountWithApp(AILanguageTips)
    const setup: any = (wrapper.vm as any).$.setupState
    setup.isShowBubble = true
    await wrapper.vm.$nextTick()
    const bubble = wrapper.find('.bubble-container')
    expect(bubble.attributes('style') || '').not.toContain('display: none')
  })
})
