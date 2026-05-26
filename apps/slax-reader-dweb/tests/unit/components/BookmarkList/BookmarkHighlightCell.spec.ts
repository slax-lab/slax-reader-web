// BookmarkList/BookmarkHighlightCell 组件单测
// props: highlight (HighlightItem)
// click → jumpToOriginal → pwaOpen
// dateString format / getContent 多分支：content 空 → approx_source.exact / 非空 → filter+map+join
import BookmarkHighlightCell from '~~/layers/core/app/components/BookmarkList/BookmarkHighlightCell.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPwaOpen } = vi.hoisted(() => ({
  mockPwaOpen: vi.fn()
}))

mockNuxtImport('pwaOpen', () => mockPwaOpen)

const baseHighlight = {
  id: 1,
  type: 'mark',
  source_type: 'bookmark',
  source_id: 100,
  title: 'Bookmark Title',
  created_at: '2026-01-01T10:00:00Z',
  content: [
    { type: 'text', text: 'highlighted ' },
    { type: 'text', text: 'text' }
  ],
  approx_source: { exact: 'fallback exact' }
}

describe('BookmarkList/BookmarkHighlightCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('渲染', () => {
    it('mount → .bookmark-item.clickable + 标题渲染', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, { props: { highlight: baseHighlight } })
      expect(wrapper.find('.bookmark-item.clickable').exists()).toBe(true)
      expect(wrapper.find('.item-footer span').text()).toBe('Bookmark Title')
    })

    it('type=mark → .stroke 渲染 highlight 内容拼接', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, { props: { highlight: baseHighlight } })
      expect(wrapper.find('.stroke').exists()).toBe(true)
      expect(wrapper.find('.stroke').text()).toBe('highlighted text')
    })

    it('type=comment → 渲染 comment + quote-content', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, type: 'comment', comment: 'My comment' } }
      })
      expect(wrapper.find('.cell-title').text()).toBe('My comment')
      expect(wrapper.find('.quote-content').exists()).toBe(true)
    })

    it('type=reply + 父评论存在 → 渲染父评论', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: {
          highlight: {
            ...baseHighlight,
            type: 'reply',
            comment: 'My reply',
            parent_comment: 'Original comment',
            parent_comment_deleted: false
          }
        }
      })
      expect(wrapper.find('.cell-title').text()).toBe('My reply')
      expect(wrapper.find('.quote-content').text()).toBe('Original comment')
    })

    it('type=reply + parent_comment_deleted=true → quote-content 添加 deleted class', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: {
          highlight: {
            ...baseHighlight,
            type: 'reply',
            comment: 'My reply',
            parent_comment_deleted: true
          }
        }
      })
      expect(wrapper.find('.quote-content.deleted').exists()).toBe(true)
    })

    it('title 空 → article-header 不渲染', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, title: '' } }
      })
      expect(wrapper.find('.article-header').exists()).toBe(false)
    })
  })

  describe('getContent 分支', () => {
    it('content 空数组 → 返 approx_source.exact', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, content: [] } }
      })
      expect(wrapper.find('.stroke').text()).toBe('fallback exact')
    })

    it('content 含 image type → image 被过滤', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: {
          highlight: {
            ...baseHighlight,
            content: [
              { type: 'text', text: 'A' },
              { type: 'image', text: 'IMG' },
              { type: 'text', text: 'B' }
            ]
          }
        }
      })
      expect(wrapper.find('.stroke').text()).toBe('AB')
    })

    it('content 含 \\n / \\t → 被剔除', () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: {
          highlight: {
            ...baseHighlight,
            content: [{ type: 'text', text: 'A\nB\tC' }]
          }
        }
      })
      expect(wrapper.find('.stroke').text()).toBe('ABC')
    })
  })

  describe('jumpToOriginal', () => {
    it('source_type=share → pwaOpen /s/<id>?highlight=<id>', async () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, source_type: 'share', source_id: 'SHR' } }
      })
      await wrapper.find('.bookmark-item').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/s/SHR?highlight=1' })
    })

    it('source_type=collection → pwaOpen /c/<id>?highlight=<id>', async () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, source_type: 'collection', source_id: 'COL' } }
      })
      await wrapper.find('.bookmark-item').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/c/COL?highlight=1' })
    })

    it('default source_type → pwaOpen /bookmarks/<id>?highlight=<id>', async () => {
      const wrapper = mountWithApp(BookmarkHighlightCell, {
        props: { highlight: { ...baseHighlight, source_type: 'bookmark', source_id: 100 } }
      })
      await wrapper.find('.bookmark-item').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/bookmarks/100?highlight=1' })
    })
  })
})
