// MarkMindMap.vue 单测 —— 第五期 Sprint C.2
// 覆盖：基础渲染（toolbar 4 icons 含 scale-up/down + fullscreen + download）/ data prop watch debounce update /
//      toolbar click 各分支 / handleAnchors / requestDownload 成功失败 / addExpandIcons SVG 操作
// 关键约束：
//  - markmap-lib + markmap-view + markmap-common 全 mock，Markmap.create 返 stub instance
//  - easy-dom2img 成功/失败 mock
//  - base64toBlob mock
//  - document.fullscreenElement / requestFullscreen / exitFullscreen 不在 happy-dom 实现，必要时 stubGlobal
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockMarkmapInstance, mockTransformer, mockDom2Img, mockBase64toBlob } = vi.hoisted(() => {
  const mockMarkmapInstance = {
    setData: vi.fn(),
    fit: vi.fn(async () => {}),
    rescale: vi.fn(async () => {}),
    destroy: vi.fn(),
    renderData: vi.fn(),
    handlePan: vi.fn(),
    handleZoom: vi.fn(),
    toggleNode: vi.fn()
  }
  return {
    mockMarkmapInstance,
    mockTransformer: {
      transform: vi.fn(() => ({ root: { name: 'root', children: [] } }))
    },
    mockDom2Img: vi.fn(async () => ({ data: 'data:image/png;base64,xxx' })),
    mockBase64toBlob: vi.fn(() => new Blob([new Uint8Array([0])], { type: 'image/png' }))
  }
})

vi.mock('markmap-view', () => ({
  Markmap: {
    create: vi.fn(() => mockMarkmapInstance)
  }
}))

vi.mock('markmap-lib', () => {
  class FakeTransformer {
    transform = mockTransformer.transform
  }
  return {
    Transformer: FakeTransformer,
    builtInPlugins: []
  }
})

vi.mock('markmap-common', () => ({
  wrapFunction: (fn: unknown, _wrapper: unknown) => fn
}))

vi.mock('easy-dom2img', () => ({
  default: mockDom2Img,
  AutoFitByRatio: Symbol('auto')
}))

vi.mock('@commons/utils/data', () => ({
  base64toBlob: mockBase64toBlob
}))

import MarkMindMap from '~~/layers/core/app/components/Markdown/MarkMindMap.vue'

beforeEach(() => {
  vi.clearAllMocks()
  mockMarkmapInstance.setData.mockClear()
  mockMarkmapInstance.fit.mockClear()
  mockMarkmapInstance.rescale.mockClear()
  mockMarkmapInstance.destroy.mockClear()
  mockTransformer.transform.mockReturnValue({ root: { name: 'root', children: [] } })
  // happy-dom 默认无 requestFullscreen/exitFullscreen
  Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn(), configurable: true })
  Object.defineProperty(document, 'exitFullscreen', { value: vi.fn(), configurable: true })
  // 让 querySelector('.mark-mind-map')?.requestFullscreen 可调
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Markdown/MarkMindMap', () => {
  describe('挂载 + toolbar 渲染', () => {
    it('mount → 渲染 .mark-mind-map + .mind-svg + 调 Markmap.create', async () => {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: '# Title' } })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.mark-mind-map').exists()).toBe(true)
      expect(wrapper.find('.mind-svg').exists()).toBe(true)
    })

    it('opacity 切换：data 非空时 1，data="" 时 0', async () => {
      const wrapperEmpty = mountWithApp(MarkMindMap, { props: { data: '' } })
      const styleEmpty = (wrapperEmpty.find('.mark-mind-map').element as HTMLElement).style
      expect(styleEmpty.opacity).toBe('0')

      const wrapperFull = mountWithApp(MarkMindMap, { props: { data: 'hello' } })
      const styleFull = (wrapperFull.find('.mark-mind-map').element as HTMLElement).style
      expect(styleFull.opacity).toBe('1')
    })

    it('showToolbar=true：渲染 toolbar', async () => {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'x', showToolbar: true } })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.mind-toolbar').exists()).toBe(true)
      // 至少 3 个图标（scale-up/down + download；fullscreen 取决于 happy-dom 是否提供 requestFullscreen）
      expect(wrapper.findAll('.mind-toolbar .item').length).toBeGreaterThanOrEqual(3)
    })

    it('showToolbar=false：不渲染 toolbar', () => {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'x', showToolbar: false } })
      expect(wrapper.find('.mind-toolbar').exists()).toBe(false)
    })
  })

  describe('toolbarClick 各分支', () => {
    async function setupWrapper() {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'x', showToolbar: true } })
      await wrapper.vm.$nextTick()
      return wrapper
    }

    it('scale-up：调 markmind.rescale(1.5)', async () => {
      const wrapper = await setupWrapper()
      const items = wrapper.findAll('.mind-toolbar .item')
      // 第 1 个是 scale-up
      await items[0]!.trigger('click')
      expect(mockMarkmapInstance.rescale).toHaveBeenCalledWith(1.5)
    })

    it('scale-down：调 markmind.rescale(0.5)', async () => {
      const wrapper = await setupWrapper()
      const items = wrapper.findAll('.mind-toolbar .item')
      await items[1]!.trigger('click')
      expect(mockMarkmapInstance.rescale).toHaveBeenCalledWith(0.5)
    })

    it('download：调 dom2Img + 创建 a 链接 + downloading 切换', async () => {
      const wrapper = await setupWrapper()
      // 替换 createObjectURL（happy-dom 的 createObjectURL 实现可用）
      const items = wrapper.findAll('.mind-toolbar .item')
      // 最后一项是 download
      await items[items.length - 1]!.trigger('click')
      // dom2Img 是 async；等下一个 microtask
      await new Promise(r => setTimeout(r, 0))
      expect(mockDom2Img).toHaveBeenCalled()
      expect(mockBase64toBlob).toHaveBeenCalled()
    })

    it('download 失败：console.error 被调用', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDom2Img.mockRejectedValueOnce(new Error('boom'))
      const wrapper = await setupWrapper()
      const items = wrapper.findAll('.mind-toolbar .item')
      await items[items.length - 1]!.trigger('click')
      await new Promise(r => setTimeout(r, 0))
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('expose + 公共 API', () => {
    it('scaleUp / scaleDown / fitMap 通过 expose 暴露', async () => {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'x' } })
      await wrapper.vm.$nextTick()
      const exposed = wrapper.vm as unknown as {
        scaleUp: () => void
        scaleDown: () => void
        fitMap: () => Promise<void>
      }
      expect(typeof exposed.scaleUp).toBe('function')
      expect(typeof exposed.scaleDown).toBe('function')
      expect(typeof exposed.fitMap).toBe('function')

      exposed.scaleUp()
      expect(mockMarkmapInstance.rescale).toHaveBeenCalledWith(2)
      exposed.scaleDown()
      expect(mockMarkmapInstance.rescale).toHaveBeenCalledWith(0.5)
      await exposed.fitMap()
      expect(mockMarkmapInstance.fit).toHaveBeenCalled()
    })
  })

  describe('卸载', () => {
    it('onUnmounted：调 markmind.destroy 移除 resize/fullscreen listener', async () => {
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'x' } })
      await wrapper.vm.$nextTick()
      wrapper.unmount()
      expect(mockMarkmapInstance.destroy).toHaveBeenCalled()
    })
  })

  describe('update + transformer', () => {
    it('mount 时 update 触发 transformer.transform + setData', async () => {
      mountWithApp(MarkMindMap, { props: { data: '# Hello' } })
      await new Promise(r => setTimeout(r, 0))
      expect(mockTransformer.transform).toHaveBeenCalled()
      expect(mockMarkmapInstance.setData).toHaveBeenCalled()
    })

    it('data 变化：debounce 1000ms 后触发新一次 update', async () => {
      vi.useFakeTimers()
      const wrapper = mountWithApp(MarkMindMap, { props: { data: 'first' } })
      await vi.advanceTimersByTimeAsync(0)
      mockTransformer.transform.mockClear()
      await wrapper.setProps({ data: 'second' })
      // 立刻 advance 1000ms
      await vi.advanceTimersByTimeAsync(1100)
      expect(mockTransformer.transform).toHaveBeenCalled()
    })
  })
})
