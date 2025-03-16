import BookmarkPanel, { BookmarkPanelType } from '#layers/base/components/BookmarkPanel.vue'

import { mount } from '@vue/test-utils'
import { getI18nLang } from '~~/i18n/config'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

describe('书签侧边栏测试', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: getI18nLang()
  })

  const pinia = createPinia()

  const types = [BookmarkPanelType.AI, BookmarkPanelType.CHATBOT, BookmarkPanelType.FEEDBACK, BookmarkPanelType.UNARCHIVE, BookmarkPanelType.TOP, BookmarkPanelType.ARCHIVE]
  const testTypes: BookmarkPanelType[] = []

  for (const type of types) {
    testTypes.push(type)
    it('检测渲染数目', () => {
      const wrapper = mount(BookmarkPanel, {
        props: {
          types: testTypes
        },
        global: {
          plugins: [i18n, pinia]
        }
      })

      const res = wrapper.findAll('button')
      expect(res.length).toBe(testTypes.length)
    })
  }
})
