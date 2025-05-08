import { removeOuterTag } from '@commons/utils/dom'
import { HighlightRange } from '@commons/utils/range'

import { Base } from './base'
import type { DrawMarkBaseInfo, MarkItemInfo, SelectionConfig } from './type'
import type { MarkPathItem } from '@commons/types/interface'
import { useUserStore } from '#layers/core/stores/user'

export class MarkRenderer extends Base {
  private _handleMarkClickHandler?: (ele: HTMLElement) => void

  constructor(config: SelectionConfig) {
    super(config)
  }

  async drawMark(info: MarkItemInfo, action: 'create' | 'update' = 'create') {
    const userId = useUserStore().userInfo?.userId

    const isComment = info.comments.length > 0
    const isStroke = info.stroke.length > 0
    const isSelfStroke = !!info.stroke.find(item => item.userId === userId)

    if (action === 'create') {
      const baseInfo = {
        id: info.id,
        isStroke,
        isComment,
        isSelfStroke
      } as DrawMarkBaseInfo

      let drawMark = false
      for (const markItem of info.source) {
        if (!isStroke && !isComment) continue

        const infos = this.transferNodeInfos(markItem)
        for (const infoItem of infos) {
          if (infoItem.type === 'image') {
            this.addImageMark({ ...baseInfo, ele: infoItem.ele as HTMLImageElement })
            continue
          }
          this.addMark({ ...baseInfo, node: infoItem.node, start: infoItem.start, end: infoItem.end })
        }

        drawMark = infos.length > 0
      }

      if (!drawMark && info.approx) {
        const rangeSvc = new HighlightRange(this.document, this.config.monitorDom!)
        const newRange = rangeSvc.getRange(info.approx)
        if (newRange) {
          this.addMarksInRange(newRange, baseInfo)
        }
      }
    } else {
      const slaxMarks = Array.from(this.document.querySelectorAll(`slax-mark[data-uuid="${info.id}"]`))
      slaxMarks.forEach(mark => {
        if (isStroke) mark.classList.add('stroke')
        else mark.classList.remove('stroke')

        if (isComment) mark.classList.add('comment')
        else mark.classList.remove('comment')

        if (isSelfStroke) mark.classList.add('self-stroke')
        else mark.classList.remove('self-stroke')

        if (!isStroke && !isComment) removeOuterTag(mark)
      })
    }

    return info.id
  }

  addMarksInRange(range: Range, baseInfo: DrawMarkBaseInfo) {
    const markHandler = this.config.iframe ? this.addMarkInline.bind(this) : this.addMark.bind(this)

    if (range.startContainer === range.endContainer) {
      markHandler({
        ...baseInfo,
        node: range.startContainer,
        start: range.startOffset,
        end: range.endOffset
      })
      return
    }

    const nodes = this.getTextNodesInRange(range)

    if (nodes.length > 0) {
      if (nodes[0] === range.startContainer) {
        markHandler({
          ...baseInfo,
          node: nodes[0],
          start: range.startOffset,
          end: (nodes[0].textContent || '').length
        })
      }

      for (let i = 1; i < nodes.length - 1; i++) {
        markHandler({
          ...baseInfo,
          node: nodes[i],
          start: 0,
          end: (nodes[i].textContent || '').length
        })
      }

      if (nodes.length > 1 && nodes[nodes.length - 1] === range.endContainer) {
        markHandler({
          ...baseInfo,
          node: nodes[nodes.length - 1],
          start: 0,
          end: range.endOffset
        })
      }
    }
  }

  getTextNodesInRange(range: Range): Node[] {
    const nodes: Node[] = []
    const monitorDom = this.config.monitorDom || this.document.body

    const walker = this.document.createTreeWalker(monitorDom, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        if (!node.textContent || node.textContent.trim() === '') {
          return NodeFilter.FILTER_REJECT
        }

        let parent = node.parentNode
        while (parent) {
          if (parent.nodeType === Node.ELEMENT_NODE) {
            const tagName = (parent as Element).tagName
            if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT
            }
          }
          parent = parent.parentNode
        }

        const nodeRange = this.document.createRange()
        nodeRange.selectNode(node)

        const nodeInRange = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 && range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0

        return nodeInRange ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      }
    })

    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim() !== '') {
        nodes.push(node)
      }
    }

    return nodes
  }

  addImageMarkInline(info: DrawMarkBaseInfo & { ele: HTMLImageElement }) {
    const { id, ele, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const mark = this.document.createElement('slax-mark')
    mark.dataset.uuid = id

    mark.style.padding = '0'
    mark.style.position = 'relative'
    mark.style.display = 'inline-block'

    if (isStroke) {
      mark.classList.add('stroke')
      mark.style.border = '2px solid #f6af69'
    }

    if (isComment) {
      mark.classList.add('comment')
      mark.style.border = '2px dashed #f6af69'
    }

    if (isSelfStroke) {
      mark.classList.add('self-stroke')
    }

    if (isHighlighted) {
      mark.classList.add('highlighted')
      mark.style.backgroundColor = '#fcf4e8'
    }

    mark.style.position = 'relative'
    const afterStyle = this.document.createElement('style')
    afterStyle.textContent = `
      slax-mark[data-uuid="${id}"]::after {
        content: '···';
        position: absolute;
        height: 25px;
        width: 25px;
        padding-left: 0;
        padding-right: 0;
        border-radius: 50%;
        background-color: #f6af69ee;
        right: -5px;
        top: -5px;
        line-height: 25px;
        color: #fff;
        font-size: 15px;
        text-align: center;
        transition: transform 250ms;
      }
    `
    this.document.head.appendChild(afterStyle)

    mark.onclick = e => {
      const target = e.target as HTMLElement
      if (target && this._handleMarkClickHandler) this._handleMarkClickHandler(target)
      e.stopPropagation()
    }

    ele.parentElement?.insertBefore(mark, ele)
    ele.remove()
    mark.appendChild(ele)
  }

  addMarkInline(info: DrawMarkBaseInfo & { node: Node; start: number; end: number }) {
    const { id, node, start, end, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const range = this.document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    const mark = this.document.createElement('slax-mark')
    mark.dataset.uuid = id

    mark.style.color = 'inherit'
    mark.style.position = 'relative'
    mark.style.transition = 'color 250ms'

    if (isStroke) {
      mark.classList.add('stroke')
      mark.style.cursor = 'pointer'
      mark.style.borderBottom = isSelfStroke ? '1.5px solid #f6af69' : '1.5px dashed #f6af69'
    }

    if (isComment) {
      mark.classList.add('comment')
      mark.style.cursor = 'pointer'
      mark.style.borderBottom = '1.5px dashed #f6af69'
    }

    if (isSelfStroke) {
      mark.classList.add('self-stroke')
    }

    if (isHighlighted) {
      mark.classList.add('highlighted')
      mark.style.backgroundColor = '#fcf4e8'
    }

    range.surroundContents(mark)
  }

  addMark(info: DrawMarkBaseInfo & { node: Node; start: number; end: number }) {
    const { id, node, start, end, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const range = this.document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    const mark = this.document.createElement('slax-mark')
    mark.dataset.uuid = id
    if (isStroke) mark.classList.add('stroke')
    if (isComment) mark.classList.add('comment')
    if (isSelfStroke) mark.classList.add('self-stroke')
    if (isHighlighted) mark.classList.add('highlighted')

    mark.onclick = e => {
      const target = e.target as HTMLElement
      if (target && this._handleMarkClickHandler) this._handleMarkClickHandler(target)
    }

    range.surroundContents(mark)
  }

  addImageMark(info: DrawMarkBaseInfo & { ele: HTMLImageElement }) {
    const { id, ele, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const mark = this.document.createElement('slax-mark')
    mark.dataset.uuid = id
    if (isStroke) mark.classList.add('stroke')
    if (isComment) mark.classList.add('comment')
    if (isSelfStroke) mark.classList.add('self-stroke')
    if (isHighlighted) mark.classList.add('highlighted')

    mark.onclick = e => {
      const target = e.target as HTMLElement
      if (target && this._handleMarkClickHandler) this._handleMarkClickHandler(target)
      e.stopPropagation()
    }

    ele.parentElement?.insertBefore(mark, ele)
    ele.remove()
    mark.appendChild(ele)
  }

  transferNodeInfos(markItem: MarkPathItem) {
    const infos: ({ start: number; end: number; node: Node; type: 'text' } | { type: 'image'; ele: Element })[] = []
    if (markItem.type === 'text') {
      const baseElement = this.config.monitorDom?.querySelector(markItem.path) as HTMLElement
      if (!baseElement) {
        return infos
      }

      const nodes = this.getAllTextNodes(baseElement)
      const nodeLengths = nodes.map(node => (node.textContent || '').length)

      let startOffset = markItem.start || 0
      const endOffset = markItem.end || 0
      let base = 0

      for (let i = 0; i < nodeLengths.length; i++) {
        if (base + nodeLengths[i] <= startOffset) {
          base += nodeLengths[i]
          continue
        }
        if (endOffset - base <= nodeLengths[i]) {
          infos.push({ type: 'text', start: startOffset - base, end: endOffset - base, node: nodes[i] })
          break
        } else {
          infos.push({ type: 'text', start: startOffset - base, end: nodeLengths[i], node: nodes[i] })
          startOffset += nodeLengths[i] - (startOffset - base)
          base += nodeLengths[i]
        }
      }
    } else if (markItem.type === 'image') {
      let element = this.config.monitorDom?.querySelector(markItem.path) as HTMLImageElement
      if (!element || !element.src) {
        const paths = markItem.path.split('>')
        const tailIdx = paths.length - 1
        const newPath = [...paths.slice(0, tailIdx), ' slax-mark ', paths[tailIdx]]
        element = this.config.monitorDom?.querySelector(newPath.join('>')) as HTMLImageElement
      }
      infos.push({ type: 'image', ele: element })
    }
    return infos
  }

  getAllTextNodes(element: HTMLElement): Node[] {
    const unsupportTags = ['UNSUPPORT-VIDEO', 'SCRIPT', 'STYLE', 'NOSCRIPT']
    const textNodes: Node[] = []
    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node)
      } else if (node.nodeType === Node.ELEMENT_NODE && unsupportTags.indexOf((node as Element).tagName) === -1) {
        node.childNodes.forEach(child => traverse(child))
      }
    }
    traverse(element)
    return textNodes
  }

  setMarkClickHandler(handler: (ele: HTMLElement) => void) {
    this._handleMarkClickHandler = handler
  }
}
