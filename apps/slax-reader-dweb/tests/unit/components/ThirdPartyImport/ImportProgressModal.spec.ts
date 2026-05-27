// ThirdPartyImport/ImportProgressModal 组件单测
// 顶层调 getImportProgressData() → request.get(IMPORT_THIRD_PARTY_DATA_PROGRESS)
// 失败 → Toast Error；成功 → progressData 设值
// emit close (modal-overlay self click + close-btn click)
// 多个 helper：getStatusText / getStatusClass / getPlatformIcon / formatDate
import ImportProgressModal from '~~/layers/core/app/components/ThirdPartyImport/ImportProgressModal.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('mount → 渲染 .modal-overlay + .modal-content + h3 标题', async () => {
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-content').exists()).toBe(true)
    expect(wrapper.find('.modal-header h3').exists()).toBe(true)
  })

  it('isLoading=true 期间 → 渲染 .loading-container', async () => {
    let resolve: any
    mockGet.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r
        })
    )
    const wrapper = mountWithApp(ImportProgressModal)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading-container').exists()).toBe(true)
    resolve?.([])
    await flushPromises()
  })

  it('成功获取 progressData → 渲染 .progress-table + 行', async () => {
    mockGet.mockResolvedValueOnce([baseItem])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    expect(wrapper.find('.progress-table').exists()).toBe(true)
    // header + 1 data row
    expect(wrapper.findAll('.table-row').length).toBeGreaterThanOrEqual(2)
  })

  it('mockGet 返 null → Toast Error', async () => {
    mockGet.mockResolvedValueOnce(null)
    mountWithApp(ImportProgressModal)
    await flushPromises()
    expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('close-btn click → emit close', async () => {
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    await wrapper.find('button.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('点击 modal-overlay 自身 → emit close', async () => {
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('status=3 → status-success class + "Success" 文本', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 3 }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const statusSpan = wrapper.find('.status span')
    expect(statusSpan.classes()).toContain('status-success')
    expect(statusSpan.text()).toBe('Success')
  })

  it('status=0 → status-pending class + "Pending"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 0 }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const statusSpan = wrapper.find('.status span')
    expect(statusSpan.classes()).toContain('status-pending')
    expect(statusSpan.text()).toBe('Pending')
  })

  it('status=2 → status-failed class + "Failed"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 2 }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const statusSpan = wrapper.find('.status span')
    expect(statusSpan.classes()).toContain('status-failed')
    expect(statusSpan.text()).toBe('Failed')
  })

  it('status=1 → status-processing class + "Processing"', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, status: 1 }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const statusSpan = wrapper.find('.status span')
    expect(statusSpan.classes()).toContain('status-processing')
    expect(statusSpan.text()).toBe('Processing')
  })

  it('platform=omnivore → 渲染 omnivore icon', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'omnivore' }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const img = wrapper.find('.platform img')
    expect(img.attributes('src')).toContain('omnivore')
  })

  it('platform=pocket → 渲染 pocket icon', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'pocket' }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const img = wrapper.find('.platform img')
    expect(img.attributes('src')).toContain('pocket')
  })

  it('platform 未知 → icon src 空', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, type: 'unknown' }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    const img = wrapper.find('.platform img')
    expect(img.attributes('src') || '').toBe('')
  })

  it('progress 计算 = round(current_count / batch_count * 100)', async () => {
    mockGet.mockResolvedValueOnce([{ ...baseItem, current_count: 30, batch_count: 100 }])
    const wrapper = mountWithApp(ImportProgressModal)
    await flushPromises()
    expect(wrapper.find('.progress').text()).toBe('30%')
  })
})
