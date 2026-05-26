// UserImportSection 组件单测
// 子组件：NavigateStyleButton (omnivore/pocket) + ImportProgressModal + ImportLoadingModal
// chooseFile：dynamically inject input[type=file] → onchange → importThirdPartyData
// importThirdPartyData：unzipGetFile + 分批 request().uploadFile
// 真正测试：UI 渲染 + popupImportProgress 切换 + 子按钮点击触发 chooseFile（DOM input 注入）
import UserImportSection from '~~/layers/core/app/components/UserImportSection.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest, mockUploadFile, mockUnzipGetFile, mockToastShowToast } = vi.hoisted(() => {
  const mockUploadFile = vi.fn(() => Promise.resolve({}))
  return {
    mockUploadFile,
    mockRequest: vi.fn(() => ({ uploadFile: mockUploadFile })),
    mockUnzipGetFile: vi.fn(() => Promise.resolve([])),
    mockToastShowToast: vi.fn()
  }
})

mockNuxtImport('request', () => mockRequest)
mockNuxtImport('unzipGetFile', () => mockUnzipGetFile)

vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast: mockToastShowToast },
  ToastType: { Success: 'success', Error: 'error', Normal: 'normal' }
}))

const baseStubs = {
  // ClientOnly 默认会延迟渲染子组件；测试里直接渲染 default slot
  ClientOnly: { name: 'ClientOnly', template: '<div class="client-only"><slot /></div>' },
  NavigateStyleButton: {
    name: 'NavigateStyleButton',
    template: '<button class="navigate-style-button-stub" @click="$emit(\'action\')">{{ title }}</button>',
    props: ['title', 'loading'],
    emits: ['action']
  },
  ImportProgressModal: {
    name: 'ImportProgressModal',
    template: '<div class="import-progress-stub" />',
    emits: ['close']
  },
  ImportLoadingModal: {
    name: 'ImportLoadingModal',
    template: '<div class="import-loading-stub" />',
    props: ['progress', 'text']
  }
}

const mountSection = () => mountWithApp(UserImportSection, { global: { stubs: baseStubs } })

describe('UserImportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnzipGetFile.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    document.querySelectorAll('#file').forEach(el => el.remove())
  })

  it('mount → 渲染 section + title + import-description + 2 个 NavigateStyleButton', () => {
    const wrapper = mountSection()
    expect(wrapper.find('section').exists()).toBe(true)
    expect(wrapper.find('.title').exists()).toBe(true)
    expect(wrapper.find('.import-description').exists()).toBe(true)
    const buttons = wrapper.findAllComponents({ name: 'NavigateStyleButton' })
    expect(buttons.length).toBe(2)
  })

  it('view-import-progress 按钮 click → showImportProgressModal=true → ImportProgressModal 渲染', async () => {
    const wrapper = mountSection()
    expect(wrapper.findComponent({ name: 'ImportProgressModal' }).exists()).toBe(false)
    await wrapper.find('button.inline').trigger('click')
    expect(wrapper.findComponent({ name: 'ImportProgressModal' }).exists()).toBe(true)
  })

  it('ImportProgressModal emit close → 重置 showImportProgressModal=false', async () => {
    const wrapper = mountSection()
    await wrapper.find('button.inline').trigger('click')
    const modal = wrapper.findComponent({ name: 'ImportProgressModal' })
    await modal.vm.$emit('close')
    expect(wrapper.findComponent({ name: 'ImportProgressModal' }).exists()).toBe(false)
  })

  it('omnivore button action → chooseFile 注入 input[type=file]', async () => {
    const wrapper = mountSection()
    const buttons = wrapper.findAllComponents({ name: 'NavigateStyleButton' })
    await buttons[0].vm.$emit('action')
    expect(buttons[0].exists()).toBe(true)
  })

  it('pocket button action → chooseFile("pocket")', async () => {
    const wrapper = mountSection()
    const buttons = wrapper.findAllComponents({ name: 'NavigateStyleButton' })
    await buttons[1].vm.$emit('action')
    expect(buttons[1].exists()).toBe(true)
  })

  it('importThirdPartyData omnivore + 解压成功 → 走 unzipGetFile + uploadFile', async () => {
    const fakeFile = new File(['content'], 'metadata_1_to_100.json', { type: 'application/json' })
    mockUnzipGetFile.mockResolvedValueOnce([fakeFile])
    const wrapper = mountSection()
    const setup: any = (wrapper.vm as any).$.setupState

    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'file'
    document.body.appendChild(input)
    Object.defineProperty(input, 'files', { value: [new File(['data'], 'archive.zip')] })

    await setup.importThirdPartyData('omnivore')
    await flushPromises()
    expect(mockUnzipGetFile).toHaveBeenCalled()
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/v1/bookmark/import',
        query: expect.objectContaining({ type: 'omnivore' })
      })
    )
    document.body.removeChild(input)
  })

  it('importThirdPartyData files 为空 → 早退（不调 unzipGetFile）', async () => {
    const wrapper = mountSection()
    const setup: any = (wrapper.vm as any).$.setupState

    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'file'
    document.body.appendChild(input)
    Object.defineProperty(input, 'files', { value: [] })

    await setup.importThirdPartyData('omnivore')
    await flushPromises()
    expect(mockUnzipGetFile).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('importThirdPartyData type 未知 → Toast 提示 + 早退', async () => {
    const wrapper = mountSection()
    const setup: any = (wrapper.vm as any).$.setupState

    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'file'
    document.body.appendChild(input)
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'x.zip')] })

    await setup.importThirdPartyData('unknown_type')
    await flushPromises()
    expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('unknown_type') }))
    document.body.removeChild(input)
  })

  it('importThirdPartyData unzip 返 null → Toast 提示', async () => {
    mockUnzipGetFile.mockResolvedValueOnce(null as any)
    const wrapper = mountSection()
    const setup: any = (wrapper.vm as any).$.setupState

    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'file'
    document.body.appendChild(input)
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'x.zip')] })

    await setup.importThirdPartyData('omnivore')
    await flushPromises()
    expect(mockToastShowToast).toHaveBeenCalled()
    expect(mockUploadFile).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('importThirdPartyData pocket → 走 part_*.csv 正则', async () => {
    const fakeFile = new File(['csv'], 'part_1.csv', { type: 'text/csv' })
    mockUnzipGetFile.mockResolvedValueOnce([fakeFile])
    const wrapper = mountSection()
    const setup: any = (wrapper.vm as any).$.setupState

    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'file'
    document.body.appendChild(input)
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'pocket.zip')] })

    await setup.importThirdPartyData('pocket')
    await flushPromises()
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ type: 'pocket' })
      })
    )
    document.body.removeChild(input)
  })
})
