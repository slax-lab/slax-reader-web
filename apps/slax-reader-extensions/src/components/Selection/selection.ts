import { getElementFullSelector, removeOuterTag } from '@commons/utils/dom'

import type { QuoteData } from '../Chat/type'
import { MarkManager } from './manager'
import SelectionModal from './modal'
import { SelectionMonitor } from './monitor'
import { MarkRenderer } from './renderer'
import { getUUID } from './tools'
import { MenuType, type SelectionConfig } from './type'
import { type MarkDetail, type MarkPathItem, type UserInfo } from '@commons/types/interface'

type SelectTextInfo =
  | {
      type: 'text'
      startOffset: number
      endOffset: number
      text: string
      node?: Node
    }
  | {
      type: 'image'
      src: string
      ele: Element
    }

export class ArticleSelection {
  private monitor: SelectionMonitor
  private manager: MarkManager
  private renderer: MarkRenderer
  private _config: SelectionConfig

  constructor(config: SelectionConfig) {
    this._config = config
    this.renderer = new MarkRenderer(this._config)
    this.manager = new MarkManager(this._config, this.renderer, this.findQuote.bind(this))
    this.monitor = new SelectionMonitor(this._config.monitorDom, this.handleMouseUp.bind(this))
  }

  startMonitor() {
    this.monitor.start()
  }

  closeMonitor() {
    this.monitor.stop()
  }

  async drawMark(marks: MarkDetail) {
    await this.manager.drawMarks(marks)
  }

  findQuote(quote: QuoteData) {
    if (quote.source.selection) {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(quote.source.selection)
      quote.source.selection.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    } else if (quote.source.paths) {
      Array.from(document.querySelectorAll(`slax-mark[data-uuid="0"]`) || []).forEach(removeOuterTag)
      const baseInfo = { id: '0', isStroke: false, isComment: false, isSelfStroke: false, isHighlighted: true }
      for (const markItem of quote.source.paths) {
        const infos = this.renderer.transferNodeInfos(markItem)
        for (const info of infos) {
          if (info.type === 'image') {
            this.renderer.addImageMark({ ...baseInfo, ele: info.ele as HTMLImageElement })
          } else {
            this.renderer.addMark({ ...baseInfo, node: info.node, start: info.start, end: info.end })
          }
        }
      }

      const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="0"]`))
      if (slaxMarks.length === 0) return

      slaxMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      const clickHandler = () => {
        slaxMarks.forEach(removeOuterTag)
        ;['mousedown', 'touchstart'].forEach(event => this.config.monitorDom?.removeEventListener(event, clickHandler))
      }
      ;['mousedown', 'touchstart'].forEach(event => this.config.monitorDom?.addEventListener(event, clickHandler))
    } else {
      const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${quote.source.id}"]`))
      if (slaxMarks.length === 0) return

      slaxMarks.forEach(mark => mark.classList.add('highlighted'))
      slaxMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

      const clickHandler = () => {
        slaxMarks.forEach(mark => mark.classList.remove('highlighted'))
        this.config.monitorDom?.removeEventListener('click', clickHandler)
      }
      this.config.monitorDom?.addEventListener('click', clickHandler)
    }
  }

  updateUserInfo(userInfo: UserInfo) {
    this._config.userInfo = userInfo
  }

  private async handleMouseUp(e: MouseEvent | TouchEvent) {
    this.monitor.clearMouseListenerTry()

    setTimeout(() => {
      const selectedInfo = this.getSelectedElementsList()
      if (!selectedInfo || selectedInfo.length === 0) {
        this.manager.updateCurrentMarkItemInfo(null)
        return
      }

      const source = this.getMarkPathItems(selectedInfo)
      if (!source) return

      const markInfoItem = this.manager.getMarkItemInfos().find(infoItem => this.manager.checkMarkSourceIsSame(infoItem.source, source))
      if (markInfoItem) {
        this.manager.updateCurrentMarkItemInfo(markInfoItem)
        this.manager.showPanel()
        return
      }

      const currentMark = this.manager.currentMarkItemInfo
      if (currentMark?.id === '' && this.manager.checkMarkSourceIsSame(currentMark.source, source)) return

      this.manager.updateCurrentMarkItemInfo({ id: '', source, comments: [], stroke: [] })
      this.manager.clearSelectContent()

      selectedInfo.forEach(item => {
        const lastContent = this.manager.selectContent[this.manager.selectContent.length - 1]
        const newContent = {
          type: item.type,
          text: item.type === 'text' ? item.text : '',
          src: item.type === 'image' ? item.src : ''
        }
        newContent.text = newContent.text.replaceAll('\n', '')
        if (lastContent?.type === 'text' && item.type === 'text') {
          lastContent.text += item.text
        } else {
          this.manager.pushSelectContent(newContent)
        }
      })

      let menusY = 0
      SelectionModal.showMenus({
        container: this.config.containerDom!,
        allowAction: this.config.allowAction,
        event: e,
        callback: (type: MenuType, event: MouseEvent) => {
          const currentInfo = this.manager.currentMarkItemInfo
          if (!currentInfo) return

          if (type === MenuType.Stroke) {
            currentInfo.id = getUUID()
            this.manager.strokeSelection({ info: currentInfo })
          } else if (type === MenuType.Copy) {
            this.manager.copyMarkedText(source, event)
          } else if (type === MenuType.Comment) {
            currentInfo.id = getUUID()
            this.manager.showPanel({ fallbackYOffset: menusY })
          } else if (type === MenuType.Chatbot && this.config.postQuoteDataHandler) {
            const quote: QuoteData = { source: {}, data: this.manager.createQuote(currentInfo.source) }
            const selection = window.getSelection()
            const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined

            const selected = this.getSelectedElementsList()
            if (!selected || selected.length === 0) {
              quote.source.selection = range
            } else {
              const paths = this.getMarkPathItems(selected)
              quote.source.paths = paths || (range ? undefined : [])
              if (!paths && range) quote.source.selection = range
            }

            this.config.postQuoteDataHandler(quote)
            this.findQuote(quote)
          }

          if (type !== MenuType.Comment) this.clearSelection()
        },
        positionCallback: ({ y }) => (menusY = y),
        noActionCallback: () => {
          this.manager.updateCurrentMarkItemInfo(null)
          this.manager.clearSelectContent()
        }
      })
    }, 0)
  }

  private getSelectedElementsList(): SelectTextInfo[] {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return []

    const range = selection.getRangeAt(0)
    const selectedInfo: SelectTextInfo[] = []

    const isNodeFullyInRange = (node: Node) => {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      return range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
    }

    const isNodePartiallyInRange = (node: Node) => range.intersectsNode(node)

    const processTextNode = (textNode: Text) => {
      if (!isNodePartiallyInRange(textNode)) return

      let startOffset = textNode === range.startContainer ? range.startOffset : 0
      let endOffset = textNode === range.endContainer ? range.endOffset : textNode.length
      startOffset = Math.max(0, Math.min(startOffset, textNode.length))
      endOffset = Math.max(startOffset, Math.min(endOffset, textNode.length))

      if (endOffset > startOffset) {
        selectedInfo.push({
          type: 'text',
          node: textNode,
          startOffset,
          endOffset,
          text: textNode.textContent!.slice(startOffset, endOffset)
        })
      }
    }

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() || '').length > 0) {
        processTextNode(node as Text)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.tagName === 'IMG' && isNodeFullyInRange(element)) {
          selectedInfo.push({ type: 'image', src: (element as HTMLImageElement).src, ele: element })
        }
        if (isNodePartiallyInRange(element)) {
          for (const child of element.childNodes) processNode(child)
        }
      }
    }

    processNode(range.commonAncestorContainer)
    return selectedInfo.length > 0 && !selectedInfo.every(item => item.type === 'text' && item.text.trim().length === 0) ? selectedInfo : []
  }

  private getMarkPathItems(infos: SelectTextInfo[]): MarkPathItem[] | null {
    const markItems: MarkPathItem[] = []
    const ele = this.config.monitorDom?.querySelector('.html-text')
    for (const info of infos) {
      if (info.type === 'text') {
        const selector = getElementFullSelector(info.node!.parentElement!, ['slax-mark'], ele!) // 假设存在此方法
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) return null

        const nodes = this.renderer.getAllTextNodes(baseElement)
        const nodeLengths = nodes.map(node => (node.textContent || '').length)
        const nodeIndex = nodes.indexOf(info.node as Node)
        if (nodeIndex === -1) continue

        const base = nodeLengths.slice(0, nodeIndex).reduce((acc, cur) => acc + cur, 0)
        markItems.push({ type: 'text', path: selector, start: base + info.startOffset, end: base + info.endOffset })
      } else if (info.type === 'image') {
        const selector = getElementFullSelector(info.ele as HTMLElement, ['slax-mark'], ele!)
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) return null
        markItems.push({ type: 'image', path: selector })
      }
    }
    return markItems
  }

  private clearSelection() {
    const selection = window.getSelection()
    if (selection) selection.removeAllRanges()
    this.manager.updateCurrentMarkItemInfo(null)
    this.manager.clearSelectContent()
  }

  get isMonitoring() {
    return this.monitor.isMonitoring
  }

  private get config() {
    return this.renderer.config
  }
}
