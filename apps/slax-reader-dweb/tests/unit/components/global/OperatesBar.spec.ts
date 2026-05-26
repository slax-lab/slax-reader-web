// global/OperatesBar.vue 单测 —— 第五期 Sprint G
// 一行 wrapper：渲染 UserOperateIcon
import OperatesBar from '~~/layers/core/app/components/global/OperatesBar.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it } from 'vitest'

describe('global/OperatesBar', () => {
  it('mount → 渲染 UserOperateIcon 子组件', () => {
    const wrapper = mountWithApp(OperatesBar, {
      global: {
        stubs: {
          UserOperateIcon: { name: 'UserOperateIcon', template: '<div class="user-operate-icon-stub" />' }
        }
      }
    })
    expect(wrapper.find('.user-operate-icon-stub').exists()).toBe(true)
  })
})
