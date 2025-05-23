import { removeOuterTag } from '@commons/utils/dom'
import { HighlightRange } from '@commons/utils/range'

import type { DrawMarkBaseInfo, MarkItemInfo, SelectionConfig } from './type'
import { type MarkPathItem } from '@commons/types/interface'

export class MarkRenderer {
  private _handleMarkClickHandler?: (ele: HTMLElement) => void

  constructor(private _config: SelectionConfig) {}

  async drawMark(info: MarkItemInfo, action: 'create' | 'update' = 'create') {
    const userId = this.config.userInfo?.userId

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
        const rangeSvc = new HighlightRange(window.document)
        const newRange = rangeSvc.getRange(info.approx)
        if (newRange) {
          this.addMarksInRange(newRange, baseInfo)
        }
      }
    } else {
      const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${info.id}"]`))
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
    if (range.startContainer === range.endContainer) {
      console.log('is same node')
      this.addMark({
        ...baseInfo,
        node: range.startContainer,
        start: range.startOffset,
        end: range.endOffset
      })
      return
    }

    const nodes = this.getTextNodesInRange(range)
    console.log('nodes', nodes)

    if (nodes.length > 0) {
      if (nodes[0] === range.startContainer) {
        this.addMark({
          ...baseInfo,
          node: nodes[0],
          start: range.startOffset,
          end: (nodes[0].textContent || '').length
        })
      }

      for (let i = 1; i < nodes.length - 1; i++) {
        this.addMark({
          ...baseInfo,
          node: nodes[i],
          start: 0,
          end: (nodes[i].textContent || '').length
        })
      }

      if (nodes.length > 1 && nodes[nodes.length - 1] === range.endContainer) {
        this.addMark({
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
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const nodeRange = document.createRange()
        nodeRange.selectNode(node)
        return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 && range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      }
    })

    let node: Node | null
    while ((node = walker.nextNode())) {
      nodes.push(node)
    }

    return nodes
  }

  addMark(info: DrawMarkBaseInfo & { node: Node; start: number; end: number }) {
    const { id, node, start, end, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    const mark = document.createElement('slax-mark')
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
    const mark = document.createElement('slax-mark')
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
      const baseElement = this._config.monitorDom?.querySelector(markItem.path) as HTMLElement
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
      let element = this._config.monitorDom?.querySelector(markItem.path) as HTMLImageElement
      if (!element || !element.src) {
        const paths = markItem.path.split('>')
        const tailIdx = paths.length - 1
        const newPath = [...paths.slice(0, tailIdx), ' slax-mark ', paths[tailIdx]]
        element = this._config.monitorDom?.querySelector(newPath.join('>')) as HTMLImageElement
      }
      infos.push({ type: 'image', ele: element })
    }
    return infos
  }

  getAllTextNodes(element: HTMLElement): Node[] {
    const unsupportTags = ['UNSUPPORT-VIDEO']
    const textNodes: Node[] = []
    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node)
      } else if (unsupportTags.indexOf(node.nodeName) === -1) {
        node.childNodes.forEach(child => traverse(child))
      }
    }
    traverse(element)
    return textNodes
  }

  setMarkClickHandler(handler: (ele: HTMLElement) => void) {
    this._handleMarkClickHandler = handler
  }

  get config() {
    return this._config
  }
}
