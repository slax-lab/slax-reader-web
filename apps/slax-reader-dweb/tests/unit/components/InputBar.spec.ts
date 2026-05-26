// InputBar 组件单测
// props: loading/disabled/placeholder/confirmTitle/confirmIcon
// model: text
// emit: confirm(text)
// expose: focus()
import { nextTick } from 'vue'

import InputBar, { InputConfirmIcon } from '~~/layers/core/app/components/InputBar.vue'

import { mountWithApp } from '~~/tests/setup/mount'
import { describe, expect, it, vi } from 'vitest'

describe('InputBar', () => {
  describe('渲染', () => {
    it('默认渲染 input + button + confirm 文案', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Search' } })
      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('button span').text()).toBe('Search')
    })

    it('placeholder 透传到 input', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go', placeholder: '搜点啥' } })
      expect(wrapper.find('input').attributes('placeholder')).toBe('搜点啥')
    })

    it('confirmIcon=Search → 渲染搜索 icon img', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Search', confirmIcon: InputConfirmIcon.Search } })
      const imgs = wrapper.findAll('button img')
      expect(imgs.some(i => i.attributes('src')?.includes('search'))).toBe(true)
    })

    it('confirmIcon=Tick → 渲染对勾 icon img', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Done', confirmIcon: InputConfirmIcon.Tick } })
      const imgs = wrapper.findAll('button img')
      expect(imgs.some(i => i.attributes('src')?.includes('tick'))).toBe(true)
    })

    it('loading=true → input disabled + button.loading 类', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Search', loading: true } })
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
      expect(wrapper.find('button').classes()).toContain('loading')
    })

    it('disabled=true → button disabled + .operate.disabled 类', () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Search', disabled: true } })
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.operate').classes()).toContain('disabled')
    })
  })

  describe('交互', () => {
    it('button click → emit confirm(text)', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go', text: 'foo' } })
      await wrapper.find('button').trigger('click')
      const events = wrapper.emitted('confirm')
      expect(events).toBeTruthy()
      expect(events![0]).toEqual(['foo'])
    })

    it('input v-model:text → 输入更新 text', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go' } })
      const input = wrapper.find('input')
      await input.setValue('hello')
      expect(wrapper.emitted('update:text')).toBeTruthy()
      expect(wrapper.emitted('update:text')![0]).toEqual(['hello'])
    })

    it('Enter 键 + disabled=false → emit confirm', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go', text: 'bar' } })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Enter' })
      const events = wrapper.emitted('confirm')
      expect(events).toBeTruthy()
      expect(events![0]).toEqual(['bar'])
    })

    it('Enter 键 + disabled=true → 不 emit confirm', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go', text: 'bar', disabled: true } })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('其他键 → 不 emit confirm（覆盖 e.key !== "Enter" 短路）', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go', text: 'bar' } })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'a' })
      expect(wrapper.emitted('confirm')).toBeUndefined()
    })
  })

  describe('暴露 focus', () => {
    it('focus() → 调 nextTick + input.focus', async () => {
      const wrapper = mountWithApp(InputBar, { props: { confirmTitle: 'Go' }, attachTo: document.body })
      const input = wrapper.find('input')
      const spy = vi.spyOn(input.element as HTMLInputElement, 'focus')
      ;(wrapper.vm as any).focus()
      await nextTick()
      expect(spy).toHaveBeenCalled()
      wrapper.unmount()
    })
  })
})
