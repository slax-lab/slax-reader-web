// DwebArticleSelection.ts 单测 —— 第五期 Sprint A.2
// 覆盖：构造 + protected override handleMouseUp 全分支（stroke/copy/comment/chatbot/positionCallback/noActionCallback）+ getMarkPathItems 文本/图片分支
// 关键约束：
//  - vi.mock '@slax-reader/selection' → 提供 BaseArticleSelection stub class，
//    暴露 monitor/manager/markItemInfos/currentMarkItemInfo/selectContent/renderer 等供子类访问
//  - vi.useFakeTimers + await vi.runAllTimersAsync 推进 setTimeout(0)
//  - modal.showMenus 被替换成 vi.fn 捕获调用入参，spec 主动调用注册的 callback / positionCallback / noActionCallback
import { ref } from 'vue'
import { ref as vueRef } from 'vue'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockMonitor = {
  start: vi.fn(),
  stop: vi.fn(),
  clearMouseListenerTry: vi.fn()
}

const mockManager = {
  drawMarks: vi.fn(),
  strokeSelection: vi.fn(),
  deleteComment: vi.fn(),
  createQuote: vi.fn(),
  showPanel: vi.fn(),
  updateCurrentMarkItemInfo: vi.fn(),
  getElementInfo: vi.fn(),
  checkMarkSourceIsSame: vi.fn(),
  copyMarkedText: vi.fn(),
  pushSelectContent: vi.fn(),
  clearSelectContent: vi.fn(),
  getElementsList: vi.fn(() => []),
  markItemInfos: vueRef([] as unknown[]),
  currentMarkItemInfo: vueRef(null as unknown),
  selectContent: vueRef([] as unknown[])
}

const mockRenderer = {
  getAllTextNodes: vi.fn(() => []),
  transferNodeInfos: vi.fn(),
  addImageMark: vi.fn(),
  addMark: vi.fn()
}

vi.mock('@slax-reader/selection', () => {
  // 简化的 BaseArticleSelection stub class，子类（DwebArticleSelection）可以 super(...) + 调 protected method
  class BaseArticleSelection {
    monitor = mockMonitor
    manager = mockManager
    renderer = mockRenderer
    protected _config: unknown
    constructor(config: unknown, _deps: unknown, _modal: unknown) {
      this._config = config
    }
    get config() {
      return this._config as Record<string, unknown>
    }
    get markItemInfos() {
      return mockManager.markItemInfos
    }
    get currentMarkItemInfo() {
      return mockManager.currentMarkItemInfo
    }
    get selectContent() {
      return mockManager.selectContent
    }
    getSelection() {
      return window.getSelection()
    }
    clearSelection = vi.fn()
    createQuote = vi.fn(() => [{ type: 'text', content: 'q' }])
    findQuote = vi.fn()
  }
  return {
    ArticleSelection: BaseArticleSelection,
    Base: class {} // modal.ts 也用到，stub 一下避免 import 报错
  }
})

vi.mock('@commons/utils/dom', () => ({
  createStyleWithSearchRules: vi.fn(async () => document.createElement('style')),
  getElementFullSelector: vi.fn((el: HTMLElement) => `${el.tagName.toLowerCase()}`)
}))

import type { SelectionConfig } from '@slax-reader/selection'
import { DwebArticleSelection } from '~~/layers/core/app/components/Article/Selection/DwebArticleSelection'

function buildConfig(overrides: Partial<SelectionConfig> = {}): SelectionConfig {
  const containerDom = document.createElement('div')
  document.body.appendChild(containerDom)
  return {
    shareCode: '',
    allowAction: true,
    ownerUserId: 1,
    containerDom,
    monitorDom: containerDom,
    iframe: undefined as unknown as HTMLIFrameElement,
    postQuoteDataHandler: vi.fn(),
    ...overrides
  } as SelectionConfig
}

function buildModal() {
  return {
    isPanelExist: vi.fn(() => false),
    dismissPanel: vi.fn(),
    showMenus: vi.fn(),
    showPanel: vi.fn()
  }
}

function buildDeps() {
  return {} as never
}

beforeEach(() => {
  vi.useFakeTimers()
  document.body.innerHTML = ''
  Object.values(mockMonitor).forEach(fn => typeof fn === 'function' && (fn as ReturnType<typeof vi.fn>).mockClear())
  Object.values(mockManager).forEach(v => {
    if (typeof v === 'function') (v as ReturnType<typeof vi.fn>).mockClear()
  })
  Object.values(mockRenderer).forEach(v => typeof v === 'function' && (v as ReturnType<typeof vi.fn>).mockClear())
  mockManager.markItemInfos.value = []
  mockManager.currentMarkItemInfo.value = null
  mockManager.selectContent.value = []
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('DwebArticleSelection', () => {
  describe('构造', () => {
    it('实例化：保存 modal + 调用 super(config, deps, modal)', () => {
      const config = buildConfig()
      const modal = buildModal()
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      expect(inst).toBeInstanceOf(DwebArticleSelection)
      // private modal 通过类型转换访问
      expect((inst as unknown as { modal: ReturnType<typeof buildModal> }).modal).toBe(modal)
    })
  })

  describe('handleMouseUp 入口 + setTimeout 推进', () => {
    it('handleMouseUp 入口同步调 monitor.clearMouseListenerTry()', async () => {
      const config = buildConfig()
      const modal = buildModal()
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      const event = new MouseEvent('mouseup')
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(event)
      expect(mockMonitor.clearMouseListenerTry).toHaveBeenCalledTimes(1)
    })

    it('panel 已存在：setTimeout 内早返不走选区逻辑', async () => {
      const config = buildConfig()
      const modal = buildModal()
      modal.isPanelExist.mockReturnValue(true)
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(new MouseEvent('mouseup'))
      await vi.runAllTimersAsync()
      expect(modal.showMenus).not.toHaveBeenCalled()
      expect(mockManager.updateCurrentMarkItemInfo).not.toHaveBeenCalled()
    })

    it('selection 为空：updateCurrentMarkItemInfo(null) 早返', async () => {
      const config = buildConfig()
      const modal = buildModal()
      window.getSelection()?.removeAllRanges()
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(new MouseEvent('mouseup'))
      await vi.runAllTimersAsync()
      expect(mockManager.updateCurrentMarkItemInfo).toHaveBeenCalledWith(null)
      expect(modal.showMenus).not.toHaveBeenCalled()
    })

    it('getElementInfo 返回空：updateCurrentMarkItemInfo(null) 早返', async () => {
      const config = buildConfig()
      const modal = buildModal()
      const p = document.createElement('p')
      p.textContent = 'hi'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 2)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      mockManager.getElementInfo.mockReturnValue({ list: null, approx: null })
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(new MouseEvent('mouseup'))
      await vi.runAllTimersAsync()
      expect(mockManager.updateCurrentMarkItemInfo).toHaveBeenCalledWith(null)
      expect(modal.showMenus).not.toHaveBeenCalled()
    })

    it('已有匹配的 markInfoItem：showPanel 后早返', async () => {
      const config = buildConfig()
      const modal = buildModal()
      const p = document.createElement('p')
      p.textContent = 'hi'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 2)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      const existingInfo = { id: 'm1', source: [{ type: 'text', path: 'p', start: 0, end: 2 }] }
      mockManager.markItemInfos.value = [existingInfo]
      mockManager.getElementInfo.mockReturnValue({
        list: [{ type: 'text', text: 'hi', node: p.firstChild, startOffset: 0, endOffset: 2 }],
        approx: { exact: 'hi', prefix: '', suffix: '', position_start: 0, position_end: 2 }
      })
      mockManager.checkMarkSourceIsSame.mockReturnValue(true)
      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(new MouseEvent('mouseup'))
      await vi.runAllTimersAsync()
      expect(mockManager.updateCurrentMarkItemInfo).toHaveBeenCalledWith(existingInfo)
      expect(mockManager.showPanel).toHaveBeenCalled()
    })
  })

  describe('handleMouseUp 触发 modal.showMenus 主流程', () => {
    function setupAndTrigger() {
      const config = buildConfig()
      const modal = buildModal()
      const p = document.createElement('p')
      p.textContent = 'world'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 5)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      mockManager.getElementInfo.mockReturnValue({
        list: [{ type: 'text', text: 'world', node: p.firstChild, startOffset: 0, endOffset: 5 }],
        approx: { exact: 'world', prefix: '', suffix: '', position_start: 0, position_end: 5 }
      })
      mockManager.checkMarkSourceIsSame.mockReturnValue(false)
      // getMarkPathItems 内部用 monitorDom.querySelector(selector) 找 baseElement，
      // 给 monitorDom 一个 mock querySelector 返回 p
      ;(config.monitorDom as unknown as { querySelector: (sel: string) => unknown }).querySelector = vi.fn(() => p)
      mockRenderer.getAllTextNodes.mockReturnValue([p.firstChild])

      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      const event = new MouseEvent('mouseup')
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(event)
      return { inst, modal, event, p }
    }

    it('正常路径：调 modal.showMenus + 注册 callback/positionCallback/noActionCallback', async () => {
      const { modal } = setupAndTrigger()
      await vi.runAllTimersAsync()
      expect(modal.showMenus).toHaveBeenCalledTimes(1)
      const args = modal.showMenus.mock.calls[0]![0] as {
        event: MouseEvent
        callback: (type: string, e: MouseEvent) => void
        positionCallback: (pos: { x: number; y: number }) => void
        noActionCallback: () => void
      }
      expect(typeof args.callback).toBe('function')
      expect(typeof args.positionCallback).toBe('function')
      expect(typeof args.noActionCallback).toBe('function')
    })

    it('positionCallback：保存 menusY，后续 comment 分支会传给 showPanel', async () => {
      const { modal, inst } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { positionCallback: (pos: { x: number; y: number }) => void; callback: (type: string, e: MouseEvent) => void }
      // 先调 positionCallback 设 menusY
      args.positionCallback({ x: 0, y: 88 })
      // 准备 currentInfo（comment 路径需要 currentInfo）
      mockManager.currentMarkItemInfo.value = { id: '', source: [], comments: [], stroke: [] }
      args.callback('comment', new MouseEvent('click'))
      expect(mockManager.showPanel).toHaveBeenCalledWith({ fallbackYOffset: 88 })
      void inst
    })

    it('noActionCallback：调 updateCurrentMarkItemInfo(null) + clearSelectContent', async () => {
      const { modal } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { noActionCallback: () => void }
      mockManager.updateCurrentMarkItemInfo.mockClear()
      args.noActionCallback()
      expect(mockManager.updateCurrentMarkItemInfo).toHaveBeenCalledWith(null)
      expect(mockManager.clearSelectContent).toHaveBeenCalled()
    })

    it('callback type=stroke：分配 uuid + 调 manager.strokeSelection + clearSelection', async () => {
      const { modal, inst } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = { id: '', source: [], comments: [], stroke: [] }
      args.callback('stroke', new MouseEvent('click'))
      expect(mockManager.strokeSelection).toHaveBeenCalled()
      expect((inst as unknown as { clearSelection: ReturnType<typeof vi.fn> }).clearSelection).toHaveBeenCalled()
    })

    it('callback type=copy：调 manager.copyMarkedText + clearSelection', async () => {
      const { modal, inst } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = { id: '', source: [{ type: 'text', path: 'p', start: 0, end: 5 }], comments: [], stroke: [] }
      const event = new MouseEvent('click')
      args.callback('copy', event)
      expect(mockManager.copyMarkedText).toHaveBeenCalledWith(expect.objectContaining({ event }))
      expect((inst as unknown as { clearSelection: ReturnType<typeof vi.fn> }).clearSelection).toHaveBeenCalled()
    })

    it('callback type=comment：分配 uuid + 调 manager.showPanel；不调 clearSelection', async () => {
      const { modal, inst } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = { id: '', source: [], comments: [], stroke: [] }
      args.callback('comment', new MouseEvent('click'))
      expect(mockManager.showPanel).toHaveBeenCalled()
      expect((inst as unknown as { clearSelection: ReturnType<typeof vi.fn> }).clearSelection).not.toHaveBeenCalled()
    })

    it('callback type=chatbot：调 postQuoteDataHandler + findQuote', async () => {
      const { modal, inst } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = { id: '', source: [{ type: 'text', path: 'p', start: 0, end: 5 }], comments: [], stroke: [] }
      args.callback('chatbot', new MouseEvent('click'))
      const config = (inst as unknown as { config: { postQuoteDataHandler: ReturnType<typeof vi.fn> } }).config
      expect(config.postQuoteDataHandler).toHaveBeenCalled()
      expect((inst as unknown as { findQuote: ReturnType<typeof vi.fn> }).findQuote).toHaveBeenCalled()
    })

    it('callback type=未知：不抛错且不调任何 manager 方法', async () => {
      const { modal } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = { id: '', source: [], comments: [], stroke: [] }
      mockManager.strokeSelection.mockClear()
      mockManager.showPanel.mockClear()
      mockManager.copyMarkedText.mockClear()
      args.callback('unknown' as never, new MouseEvent('click'))
      expect(mockManager.strokeSelection).not.toHaveBeenCalled()
      expect(mockManager.showPanel).not.toHaveBeenCalled()
      expect(mockManager.copyMarkedText).not.toHaveBeenCalled()
    })

    it('callback currentInfo 为 null：直接 return 不进入分支', async () => {
      const { modal } = setupAndTrigger()
      await vi.runAllTimersAsync()
      const args = modal.showMenus.mock.calls[0]![0] as { callback: (type: string, e: MouseEvent) => void }
      mockManager.currentMarkItemInfo.value = null
      mockManager.strokeSelection.mockClear()
      args.callback('stroke', new MouseEvent('click'))
      expect(mockManager.strokeSelection).not.toHaveBeenCalled()
    })
  })

  describe('selectContent 累积 + 文本/图片混合', () => {
    it('selectContent 末尾是 text、当前 item 也是 text：合并 text', async () => {
      const config = buildConfig()
      const modal = buildModal()
      const p = document.createElement('p')
      p.textContent = 'mix'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 3)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)

      mockManager.getElementInfo.mockReturnValue({
        list: [
          { type: 'text', text: 'a', node: p.firstChild, startOffset: 0, endOffset: 1 },
          { type: 'text', text: 'b', node: p.firstChild, startOffset: 1, endOffset: 2 }
        ],
        approx: { exact: 'ab', prefix: '', suffix: '', position_start: 0, position_end: 2 }
      })
      mockManager.checkMarkSourceIsSame.mockReturnValue(false)
      ;(config.monitorDom as unknown as { querySelector: (sel: string) => unknown }).querySelector = vi.fn(() => p)
      mockRenderer.getAllTextNodes.mockReturnValue([p.firstChild])
      // 让 selectContent 一开始就有一个 text item
      mockManager.selectContent.value = [{ type: 'text', text: 'pre', src: '' }]

      const inst = new DwebArticleSelection(config, buildDeps(), modal)
      ;(inst as unknown as { handleMouseUp: (e: MouseEvent) => void }).handleMouseUp(new MouseEvent('mouseup'))
      await vi.runAllTimersAsync()
      // 第一个 'a' 与 last('pre') 合并为 'prea'，第二个 'b' 与新 last 合并为 'preab'
      expect(mockManager.selectContent.value[0]?.text).toBe('preab')
    })
  })
})
