// CopyButton 组件单测
// 极简组件：仅一个静态 svg + i18n 文案 + hover 过渡（无 emit / 无 props 业务逻辑）
import CopyButton from '~~/layers/core/app/components/CopyButton.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('CopyButton', () => {
  it('渲染 .copy-button 容器 + .icon 内的 svg', () => {
    const wrapper = mountWithApp(CopyButton)
    expect(wrapper.find('.copy-button').exists()).toBe(true)
    const icon = wrapper.find('.icon')
    expect(icon.exists()).toBe(true)
    expect(icon.find('svg').exists()).toBe(true)
  })

  it('span 包含 i18n 文案（component.copy_button.copy_content → "Copy Content"）', () => {
    const wrapper = mountWithApp(CopyButton)
    const span = wrapper.find('.copy-button span')
    expect(span.exists()).toBe(true)
    expect(span.text().length).toBeGreaterThan(0)
  })
})
