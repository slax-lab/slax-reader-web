// modal.ts (MarkModal) 单测 —— 第五期 Sprint A.1
// 覆盖：构造（DwebEnvironmentAdapter 注入）/ isPanelExist / dismissPanel / showMenus 多分支 / showPanel 多分支
// 关键约束：
//  - vi.mock 替换两个 .ce.vue 子组件，让 ArticleSelectionMenusElement / ArticleSelectionPanelElement
//    构造为简单 HTMLElement 子类（先 customElements.define 注册，避免 happy-dom Illegal constructor）
//  - 不 mock Base 父类，让真实 Base 链路 + 真实 DwebEnvironmentAdapter 跑
//  - showMenus / showPanel 内部用 nextTick 延后定位计算，spec 用 await flushPromises 推进
import type { SelectionConfig } from '@slax-reader/selection'
import { MenuType } from '@slax-reader/selection/types'
import { flushPromises } from '@vue/test-utils'
import { MarkModal } from '~~/layers/core/app/components/Article/Selection/modal'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 1) Mock @commons/utils/dom 避免 createStyleWithSearchRules 真实读 stylesheet
vi.mock('@commons/utils/dom', () => ({
  createStyleWithSearchRules: vi.fn(async () => {
    const el = document.createElement('style')
    el.textContent = ''
    return el
  })
}))

// 2) Mock 两个 ce.vue 子组件，确保构造产物是 happy-dom 可实例化的 HTMLElement 子类
vi.mock('~~/layers/core/app/components/Article/Selection/ArticleSelectionMenus.ce.vue', () => ({
  default: {} // defineCustomElement 接受 component definition；happy-dom 会调 super() 进 HTMLElement
}))
vi.mock('~~/layers/core/app/components/Article/Selection/ArticleSelectionPanel.ce.vue', () => ({
  default: {}
}))

// 3) Mock vue 的 defineCustomElement → 返回每次独立的 HTMLElement 子类
//    不在 factory 内 customElements.define：让源码 modal.ts 顶层的 if-guard
//    `customElements.define('article-seletion-menus' / 'article-seletion-panel', ...)` 自己注册
//    happy-dom 不允许同一 class 注册多个 name；所以 mock 必须每次返回新 class
const constructorPropsLog: { name: string; props: Record<string, unknown> }[] = []

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  let counter = 0
  return {
    ...actual,
    defineCustomElement: (_definition: unknown) => {
      counter += 1
      const tag = `fake-ce-${counter}`
      const FakeCE = class extends HTMLElement {
        props: Record<string, unknown> = {}
        updateLocation = vi.fn()
        maxHeightUpdate = vi.fn()
        positionConfirmedHandler = vi.fn()
        constructor(props: Record<string, unknown> = {}) {
          super()
          this.props = props
          constructorPropsLog.push({ name: tag, props })
        }
      }
      return FakeCE as unknown as ReturnType<typeof actual.defineCustomElement>
    }
  }
})

function buildContainer(): HTMLDivElement {
  const container = document.createElement('div')
  // 让 getBoundingClientRect 不返回全 0 触发 isNullRect
  Object.defineProperty(container, 'getBoundingClientRect', {
    value: () => ({ top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) }),
    configurable: true
  })
  document.body.appendChild(container)
  return container
}

function buildConfig(overrides: Partial<SelectionConfig> = {}): SelectionConfig {
  const containerDom = buildContainer()
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

function buildSelection(text = 'hello world') {
  // 在 container 内放一个 textNode 然后选区
  const container = document.body.querySelector('div')!
  const p = document.createElement('p')
  p.textContent = text
  container.appendChild(p)
  const range = document.createRange()
  range.setStart(p.firstChild!, 0)
  range.setEnd(p.firstChild!, Math.min(text.length, 5))
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
  return { range, p }
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.querySelectorAll('.slax-reader-article-selection-menus-container-bg').forEach(el => el.remove())
  constructorPropsLog.length = 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Article/Selection/modal MarkModal', () => {
  describe('构造 + 基础方法', () => {
    it('构造：实例化不抛错且暴露 currentPanel = null', () => {
      const modal = new MarkModal(buildConfig())
      expect(modal.currentPanel).toBeNull()
    })

    it('isPanelExist：默认无 panel 返回 false', () => {
      const modal = new MarkModal(buildConfig())
      expect(modal.isPanelExist()).toBe(false)
    })

    it('isPanelExist：存在自定义容器内的 panel 节点时返回 true', () => {
      const config = buildConfig()
      const fakePanel = document.createElement('div')
      fakePanel.classList.add('slax-reader-article-selection-panel-container')
      config.containerDom!.appendChild(fakePanel)
      const modal = new MarkModal(config)
      expect(modal.isPanelExist(config.containerDom as HTMLDivElement)).toBe(true)
    })

    it('dismissPanel：currentPanel 为 null 时不抛错', async () => {
      const modal = new MarkModal(buildConfig())
      await expect(modal.dismissPanel()).resolves.toBeUndefined()
    })

    it('dismissPanel：currentPanel 不为 null 时调用其 closeModal', async () => {
      const modal = new MarkModal(buildConfig())
      const close = vi.fn()
      ;(modal as unknown as { currentPanel: { closeModal: typeof close } }).currentPanel = { closeModal: close }
      await modal.dismissPanel()
      expect(close).toHaveBeenCalledTimes(1)
    })
  })

  describe('showMenus（无 iframe 路径）', () => {
    it('containerDom 缺失：早返不创建 menus 容器', () => {
      const modal = new MarkModal(buildConfig({ containerDom: undefined as unknown as HTMLDivElement }))
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 50, clientY: 100 }) })
      expect(document.querySelector('.slax-reader-article-selection-menus-container')).toBeNull()
    })

    it('panel 已存在：早返不创建 menus 容器', () => {
      const config = buildConfig()
      const existingPanel = document.createElement('div')
      existingPanel.classList.add('slax-reader-article-selection-panel-container')
      config.containerDom!.appendChild(existingPanel)
      const modal = new MarkModal(config)
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 50, clientY: 100 }) })
      expect(document.querySelector('.slax-reader-article-selection-menus-container')).toBeNull()
    })

    it('正常路径：创建 menus 容器 + 注册 dismiss/action/noAction listener', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      buildSelection()
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 50, clientY: 100 }) })
      const menus = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container') as HTMLElement
      expect(menus).not.toBeNull()
      expect(menus.children.length).toBe(1)
      await flushPromises()
    })

    it('action listener：触发后调 callback(type, event)', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      const callback = vi.fn()
      buildSelection()
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 50, clientY: 100 }), callback })
      const menusEl = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container > *') as HTMLElement
      const fakeMouse = new MouseEvent('click')
      menusEl.dispatchEvent(new CustomEvent('action', { detail: [MenuType.Copy, fakeMouse] as unknown as Record<string, unknown> }))
      expect(callback).toHaveBeenCalledWith(MenuType.Copy, fakeMouse)
    })

    it('noAction listener：触发后调 noActionCallback', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      const noActionCallback = vi.fn()
      buildSelection()
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 0, clientY: 0 }), noActionCallback })
      const menusEl = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container > *') as HTMLElement
      menusEl.dispatchEvent(new Event('noAction'))
      expect(noActionCallback).toHaveBeenCalledTimes(1)
    })

    it('dismiss listener：触发后从 DOM 中移除 menus 容器内节点', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      buildSelection()
      modal.showMenus({ event: new MouseEvent('mouseup', { clientX: 0, clientY: 0 }) })
      const menusEl = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container > *') as HTMLElement
      menusEl.dispatchEvent(new Event('dismiss'))
      // dismiss handler 调 articleSelectionMenus.remove() 直接移除外层 menus 容器
      expect(config.containerDom!.querySelector('.slax-reader-article-selection-menus-container')).toBeNull()
    })

    it('selection 为空：早返不进入定位 nextTick 阶段', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      // 不调 buildSelection
      window.getSelection()?.removeAllRanges()
      modal.showMenus({ event: new MouseEvent('mouseup') })
      // 容器创建了但定位逻辑被 selection 检查短路
      const menus = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container') as HTMLElement
      expect(menus.children.length).toBe(1)
    })

    it('range startOffset == endOffset：早返不定位', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      // 让 range collapsed
      const p = document.createElement('p')
      p.textContent = 'x'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 0)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
      modal.showMenus({ event: new MouseEvent('mouseup') })
      const menus = config.containerDom!.querySelector('.slax-reader-article-selection-menus-container') as HTMLElement
      expect(menus).not.toBeNull()
    })

    it('已有 menus 容器：先 remove 再创建（确保只有一个）', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      buildSelection()
      modal.showMenus({ event: new MouseEvent('mouseup') })
      const before = config.containerDom!.querySelectorAll('.slax-reader-article-selection-menus-container').length
      modal.showMenus({ event: new MouseEvent('mouseup') })
      const after = config.containerDom!.querySelectorAll('.slax-reader-article-selection-menus-container').length
      expect(before).toBe(1)
      expect(after).toBe(1)
    })
  })

  describe('showPanel（无 iframe 路径）', () => {
    function buildInfo() {
      return {
        id: 'mark-1',
        source: [],
        stroke: [],
        comments: []
      }
    }

    it('containerDom 缺失：早返不创建 panel', () => {
      const modal = new MarkModal(buildConfig({ containerDom: undefined as unknown as HTMLDivElement }))
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 50 })
      expect(document.querySelector('.slax-reader-article-selection-panel-container')).toBeNull()
    })

    it('正常路径：创建 panel 容器 + 设置 currentPanel + 注册 listener', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 50 })
      const panel = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container') as HTMLElement
      expect(panel).not.toBeNull()
      expect(modal.currentPanel).not.toBeNull()
      await flushPromises()
    })

    it('已有 panel：先 remove 再创建（保持 1 个）', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      const list = config.containerDom!.querySelectorAll('.slax-reader-article-selection-panel-container')
      expect(list.length).toBe(1)
    })

    it('dismiss listener：触发后从 DOM 移除 panel + currentPanel=null + 调 dismissCallback', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      const dismissCallback = vi.fn()
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0, dismissCallback })
      const panelEl = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container > *') as HTMLElement
      panelEl.dispatchEvent(new Event('dismiss'))
      expect(config.containerDom!.querySelector('.slax-reader-article-selection-panel-container')).toBeNull()
      expect(modal.currentPanel).toBeNull()
      expect(dismissCallback).toHaveBeenCalledTimes(1)
    })

    it('action listener：触发后调 actionCallback(type, meta)', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      const actionCallback = vi.fn()
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0, actionCallback })
      const panelEl = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container > *') as HTMLElement
      const fakeEvent = new MouseEvent('click')
      const meta = { comment: 'c', info: buildInfo(), event: fakeEvent }
      panelEl.dispatchEvent(new CustomEvent('action', { detail: [MenuType.Comment, meta] as unknown as Record<string, unknown> }))
      expect(actionCallback).toHaveBeenCalledWith(MenuType.Comment, meta)
    })

    it('commentDelete listener：触发后调 commentDeleteCallback(id, markUid)', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      const commentDeleteCallback = vi.fn()
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0, commentDeleteCallback })
      const panelEl = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container > *') as HTMLElement
      panelEl.dispatchEvent(new CustomEvent('commentDelete', { detail: [{ id: 'c1', markUid: 'm1' }] as unknown as Record<string, unknown> }))
      expect(commentDeleteCallback).toHaveBeenCalledWith('c1', 'm1')
    })

    it('locationUpdate listener：更新 panel 容器 top/left 样式', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      const panelContainer = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container') as HTMLElement
      const panelEl = panelContainer.firstElementChild as HTMLElement
      panelEl.dispatchEvent(new CustomEvent('locationUpdate', { detail: [{ x: 123, y: 456 }] as unknown as Record<string, unknown> }))
      expect(panelContainer.style.left).toBe('123px')
      expect(panelContainer.style.top).toBe('456px')
    })

    it('selection 为空：使用 fallbackYOffset 设置初始 top', () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      window.getSelection()?.removeAllRanges()
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 99 })
      const panel = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container') as HTMLElement
      expect(panel.style.top).toBe('99px')
    })

    it('windowResize listener：触发后调用 panelElement.maxHeightUpdate', async () => {
      const config = buildConfig()
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      const panelEl = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container > *') as HTMLElement & {
        maxHeightUpdate: ReturnType<typeof vi.fn>
      }
      panelEl.dispatchEvent(new Event('windowResize'))
      expect(panelEl.maxHeightUpdate).toHaveBeenCalled()
    })

    it('selection 含真实 range：用 range.getBoundingClientRect 计算初始 topOffset', () => {
      const config = buildConfig()
      const p = document.createElement('p')
      p.textContent = 'rangetext'
      config.containerDom!.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 5)
      // 给 range 一个非零 rect
      Object.defineProperty(range, 'getBoundingClientRect', {
        value: () => ({ top: 200, left: 100, right: 200, bottom: 220, width: 100, height: 20, x: 100, y: 200, toJSON: () => ({}) }),
        configurable: true
      })
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      const panel = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container') as HTMLElement
      // top = rect.top - containerRect.top - 50 = 200 - 0 - 50 = 150
      expect(panel.style.top).toBe('150px')
    })
  })

  describe('iframe 路径分支', () => {
    function buildIframeConfig(): SelectionConfig {
      const containerDom = buildContainer()
      // 创建 fake iframe，带 contentDocument body 提供 getBoundingClientRect
      const iframe = document.createElement('iframe')
      document.body.appendChild(iframe)
      // happy-dom iframe.contentDocument 已可用
      const iframeBody = iframe.contentDocument!.body
      Object.defineProperty(iframeBody, 'getBoundingClientRect', {
        value: () => ({ top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) }),
        configurable: true
      })
      return {
        shareCode: '',
        allowAction: true,
        ownerUserId: 1,
        containerDom,
        monitorDom: containerDom,
        iframe,
        postQuoteDataHandler: vi.fn()
      } as SelectionConfig
    }

    it('iframe 路径：showMenus 在 iframe.contentDocument 上创建 bgDom + menus 容器', () => {
      const config = buildIframeConfig()
      const modal = new MarkModal(config)
      // 在 iframe 内部创建 selection
      const idoc = config.iframe!.contentDocument!
      const p = idoc.createElement('p')
      p.textContent = 'inside-iframe'
      idoc.body.appendChild(p)
      const range = idoc.createRange()
      range.setStart(p.firstChild!, 0)
      range.setEnd(p.firstChild!, 5)
      Object.defineProperty(range, 'getBoundingClientRect', {
        value: () => ({ top: 50, left: 50, right: 150, bottom: 70, width: 100, height: 20, x: 50, y: 50, toJSON: () => ({}) }),
        configurable: true
      })
      const sel = config.iframe!.contentWindow!.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
      modal.showMenus({ event: new MouseEvent('mouseup') })
      // bgDom + menus 都创建在 iframe.contentDocument
      expect(idoc.querySelector('.slax-reader-article-selection-menus-container-bg')).not.toBeNull()
      expect(idoc.querySelector('.slax-reader-article-selection-menus-container')).not.toBeNull()
    })

    it('iframe 路径：showPanel 设置 panel position=fixed', () => {
      const config = buildIframeConfig()
      const modal = new MarkModal(config)
      modal.showPanel({ info: buildInfo(), fallbackYOffset: 0 })
      const panel = config.containerDom!.querySelector('.slax-reader-article-selection-panel-container') as HTMLElement
      expect(panel.style.position).toBe('fixed')
    })
  })

  function buildInfo() {
    return {
      id: 'mark-1',
      source: [],
      stroke: [],
      comments: []
    }
  }
})
