// ThirdPartyImport/ImportProgressModal 组件单测
// 顶层调 getImportProgressData() → request.get(IMPORT_THIRD_PARTY_DATA_PROGRESS)
// 失败 → Toast Error；成功 → progressData 设值
// emit close (modal-overlay self click + close-btn click)
// 多个 helper：getStatusText / getStatusClass / getPlatformIcon / formatDate
import { ref } from 'vue'

import ImportProgressModal from '~~/layers/core/app/components/ThirdPartyImport/ImportProgressModal.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<any>('@vueuse/core')
  return {
    ...actual,
    useScrollLock: () => ref(false)
  }
})

const { mockRequest, mockGet, mockToastShowToast } = vi.hoisted(() => {
  const mockGet = vi.fn((): Promise<unknown> => Promise.resolve([]))
  return {
    mockGet,
    mockRequest: vi.fn(() => ({ get: mockGet })),
    mockToastShowToast: vi.fn()
  }
})

mockNuxtImport('request', () => mockRequest)

vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast: mockToastShowToast },
  ToastType: { Success: 'success', Error: 'error' }
}))

const baseItem = {
  id: 1,
  type: 'omnivore',
  status: 1,
  count: 100,
  current_count: 30,
  batch_count: 100,
  created_at: '2026-01-01T10:00:00Z'
}

describe('ThirdPartyImport/ImportProgressModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mount → 渲染 .modal-overlay + .modal-content + 标题', async () => {
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    expect(document.querySelector('.modal-overlay')).not.toBeNull()
    expect(document.querySelector('.modal-content')).not.toBeNull()
    expect(document.querySelector('.modal-title')).not.toBeNull()
    wrapper.unmount()
  })

  it('isLoading=true 期间 → 渲染 .loading-container', async () => {
    let resolve: any
    mockGet.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r
        })
    )
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.loading-container')).not.toBeNull()
    resolve?.([])
    await flushPromises()
    wrapper.unmount()
  })

  it('成功获取 progressData → 渲染 .progress-table + 行', async () => {
    mockGet.mockResolvedValueOnce([baseItem])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    expect(document.querySelector('.progress-table')).not.toBeNull()
    expect(document.querySelectorAll('.table-row').length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  it('mockGet 返 null → Toast Error', async () => {
    mockGet.mockResolvedValueOnce(null)
    mountWithApp(ImportProgressModal)
    await flushPromises()
    expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('close-btn click → emit close', async () => {
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const closeBtn = document.querySelector('button.close-btn') as HTMLElement
    closeBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('点击 modal-overlay 自身 → emit close', async () => {
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const overlay = document.querySelector('.modal-overlay') as HTMLElement
    overlay?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('status=3 → status-complete class + "Complete" 文本', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 3 }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const statusSpan = document.querySelector('.status span') as HTMLElement
    expect(statusSpan?.className).toContain('status-complete')
    expect(statusSpan?.textContent).toBe('Complete')
    wrapper.unmount()
  })

  it('status=0 → status-pending class + "Pending"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 0 }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const statusSpan = document.querySelector('.status span') as HTMLElement
    expect(statusSpan?.className).toContain('status-pending')
    expect(statusSpan?.textContent).toBe('Pending')
    wrapper.unmount()
  })

  it('status=2 → status-failed class + "Failed"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 2 }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const statusSpan = document.querySelector('.status span') as HTMLElement
    expect(statusSpan?.className).toContain('status-failed')
    expect(statusSpan?.textContent).toBe('Failed')
    wrapper.unmount()
  })

  it('status=1 → status-processing class + "Processing (percentage%)"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 1, current_count: 30, batch_count: 100 }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const statusSpan = document.querySelector('.status span') as HTMLElement
    expect(statusSpan?.className).toContain('status-processing')
    expect(statusSpan?.textContent).toBe('Processing (30%)')
    wrapper.unmount()
  })

  it('platform=omnivore → 渲染 omnivore icon', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'omnivore' }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const img = document.querySelector('.platform img') as HTMLImageElement
    expect(img?.src).toContain('omnivore')
    wrapper.unmount()
  })

  it('platform=pocket → 渲染 pocket icon', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'pocket' }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const img = document.querySelector('.platform img') as HTMLImageElement
    expect(img?.src).toContain('pocket')
    wrapper.unmount()
  })

  it('platform 未知 → icon src 空', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'unknown' }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    const img = document.querySelector('.platform img') as HTMLImageElement
    expect(img?.getAttribute('src') || '').toBe('')
    wrapper.unmount()
  })

  it('count 列展示 item.count 原值', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, count: 42 }])
    const wrapper = mountWithApp(ImportProgressModal, { attachTo: document.body })
    await flushPromises()
    // 跳过 header 行，取数据行的 count 列
    const countCells = document.querySelectorAll('.table-body .count')
    expect(countCells[0]?.textContent).toBe('42')
    wrapper.unmount()
  })
})
