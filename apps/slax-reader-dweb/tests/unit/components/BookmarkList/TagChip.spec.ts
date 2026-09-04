import { describe, expect, it, vi } from 'vitest'
import { mountWithApp } from '../../../setup/mount'
import TagChip from '#layers/core/app/components/BookmarkList/TagChip.vue'
import type { BookmarkTag } from '@commons/types/interface'

const tag: BookmarkTag = { id: 1, name: '创业', show_name: '创业', source: 'mine' }

describe('components/BookmarkList/TagChip', () => {
  it('renders name, count and the AI mark', () => {
    const w = mountWithApp(TagChip, { props: { tag, count: 12, aiMark: true } })
    expect(w.text()).toContain('创业')
    expect(w.find('.tag-count').text()).toBe('12')
    expect(w.find('.tag-ai').exists()).toBe(true)
    expect(w.classes()).toContain('mine')
  })

  it('shows no count, no mark, no buttons by default', () => {
    const w = mountWithApp(TagChip, { props: { tag: { ...tag, source: 'auto' } } })
    expect(w.find('.tag-count').exists()).toBe(false)
    expect(w.find('.tag-ai').exists()).toBe(false)
    expect(w.find('.tag-act').exists()).toBe(false)
    expect(w.classes()).not.toContain('mine')
  })

  it('emits click on the chip and remove on the × without click', async () => {
    const onClick = vi.fn()
    const onRemove = vi.fn()
    const w = mountWithApp(TagChip, { props: { tag, removable: true, onClick, onRemove } })
    expect(w.classes()).toContain('clickable')

    await w.find('.tag-act.remove').trigger('click')
    expect(onRemove).toHaveBeenCalledWith(tag)
    expect(onClick).not.toHaveBeenCalled()

    await w.trigger('click')
    expect(onClick).toHaveBeenCalledWith(tag)
  })

  it('emits promote on ↑', async () => {
    const onPromote = vi.fn()
    const w = mountWithApp(TagChip, { props: { tag, promotable: true, onPromote } })
    await w.find('.tag-act.promote').trigger('click')
    expect(onPromote).toHaveBeenCalledWith(tag)
  })
})
