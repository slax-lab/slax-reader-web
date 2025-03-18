import { objectDeepEqual } from '@commons/utils/object'
import { getUUID } from '@commons/utils/random'
import { copyText } from '@commons/utils/string'

import SelectionModal from './modal'
import { type DrawMarkBaseInfo, type MarkCommentInfo, type MarkItemInfo, MenuType, type SelectionConfig, type StrokeSelectionMeta } from './type'
import { RESTMethodPath } from '@commons/types/const'
import { type MarkDetail, type MarkInfo, type MarkPathItem, type MarkSelectContent, MarkType, type MarkUserInfo } from '@commons/types/interface'
import type { QuoteData } from '#layers/base/components/Chat/type'
import CursorToast from '#layers/base/components/CursorToast'
import Toast, { ToastType } from '#layers/base/components/Toast'
import { useUserStore } from '#layers/base/stores/user'

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

const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}

export class ArticleSelection {
  private markItemInfos: MarkItemInfo[] = []
  private currentMarkItemInfo = ref<MarkItemInfo | null>(null)
  private selectContent = ref<MarkSelectContent[]>([])
  private _isMonitoring = false

  constructor(private config: SelectionConfig) {}

  monitorHandler = (e: MouseEvent | TouchEvent) => {
    this.mouseUpHandler(e)
  }

  mouseEnterHandler = () => {
    document.removeEventListener('mouseup', this.monitorHandler)
    document.removeEventListener('touchend', this.monitorHandler)
  }

  mouseLeaveHandler = () => {
    document.addEventListener('mouseup', this.monitorHandler)
    document.addEventListener('touchend', this.monitorHandler)
  }

  startMonitor() {
    const monitorDom = this.config.monitorDom
    if (!monitorDom) return

    monitorDom.addEventListener('mouseup', this.monitorHandler)
    monitorDom.addEventListener('touchend', this.monitorHandler)

    monitorDom.addEventListener('mousedown', () => {
      monitorDom.addEventListener('mouseenter', this.mouseEnterHandler)
      monitorDom.addEventListener('mouseleave', this.mouseLeaveHandler)
    })

    this._isMonitoring = true
  }

  closeMonitor() {
    const monitorDom = this.config.monitorDom
    if (!monitorDom) return

    monitorDom.removeEventListener('mouseup', this.monitorHandler)
    monitorDom.removeEventListener('touchend', this.monitorHandler)

    this._isMonitoring = false
  }

  private createCommentObject(mark: MarkInfo, userListMap: Map<number, MarkUserInfo>): MarkCommentInfo {
    return {
      markId: mark.id,
      comment: mark.comment,
      userId: mark.user_id,
      username: userListMap.get(mark.user_id)?.username || '',
      avatar: userListMap.get(mark.user_id)?.avatar || '',
      isDeleted: mark.is_deleted,
      children: [],
      createdAt: new Date(mark.created_at),
      rootId: mark.root_id,
      showInput: false,
      loading: false
    }
  }

  // TODO 这里的职责可以拆分一下，现在太重了
  async drawMark(marks: MarkDetail) {
    const infoItems: MarkItemInfo[] = []
    const commentMap: Map<number, MarkCommentInfo> = new Map()
    const userListMap = new Map(Object.entries(marks.user_list).map(([key, value]) => [Number(key), value]))

    for (const mark of marks.mark_list) {
      if (mark.type === MarkType.COMMENT || mark.type === MarkType.REPLY) {
        const comment = this.createCommentObject(mark, userListMap)
        if (mark.type === MarkType.COMMENT) {
          comment.children = []
        }
        commentMap.set(mark.id, comment)
      }
    }

    for (const mark of marks.mark_list) {
      if (mark.type !== MarkType.REPLY) continue

      if (!commentMap.has(mark.id) || !commentMap.has(mark.parent_id) || !commentMap.has(mark.root_id)) continue

      const comment = commentMap.get(mark.id)!
      const parentComment = commentMap.get(mark.parent_id)!

      comment.reply = {
        id: parentComment.markId,
        username: parentComment.username,
        userId: parentComment.userId,
        avatar: parentComment.avatar
      }

      const rootComment = commentMap.get(comment.rootId!)
      if (!rootComment) continue

      rootComment.children.push(comment)
    }

    for (const mark of marks.mark_list) {
      const userId = mark.user_id
      const source = mark.source
      if (typeof source === 'number') continue

      const markSources = source as MarkPathItem[]
      let markInfoItem = infoItems.find(infoItem => this.checkMarkSourceIsSame(infoItem.source, markSources))

      if (!markInfoItem) {
        markInfoItem = {
          id: getUUID(),
          source: markSources,
          comments: [],
          stroke: []
        }
        infoItems.push(markInfoItem)
      }

      if (mark.type === MarkType.LINE) {
        markInfoItem.stroke?.push({ mark_id: mark.id, userId: userId })
      } else if (mark.type === MarkType.COMMENT) {
        const comment = commentMap.get(mark.id)
        if (comment) {
          markInfoItem.comments.push(comment)
        }
      }
    }

    this.markItemInfos = infoItems

    for (const info of infoItems) {
      await this.drawMarkSelection(info)
    }
  }

  findQuote(quote: QuoteData) {
    if (quote.source.selection) {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(quote.source.selection)
      quote.source.selection.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    } else if (quote.source.paths) {
      Array.from(document.querySelectorAll(`slax-mark[data-uuid="0"]`) || []).forEach(slaxMark => {
        removeOuterTag(slaxMark)
      })

      const baseInfo = {
        id: '0',
        isStroke: false,
        isComment: false,
        isSelfStroke: false,
        isHighlighted: true
      } as DrawMarkBaseInfo

      for (const markItem of quote.source.paths) {
        const infos = this.transferNodeInfos(markItem)

        for (const info of infos) {
          if (info.type === 'image') {
            const { ele } = info
            this.addImageMark({ ...baseInfo, ele: ele as HTMLImageElement })

            continue
          }

          const { node, start, end } = info
          this.addMark({
            ...baseInfo,
            node,
            start,
            end
          })
        }
      }

      const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="0"]`))
      if (slaxMarks.length === 0) {
        return
      }

      const firstSlaxMarks = slaxMarks[0]
      firstSlaxMarks.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

      const clickHandler = () => {
        slaxMarks.forEach(slaxMark => {
          removeOuterTag(slaxMark)
        })
        ;['mousedown', 'touchstart'].forEach(event => {
          this.config.monitorDom?.removeEventListener(event, clickHandler)
        })
      }

      ;['mousedown', 'touchstart'].forEach(event => {
        this.config.monitorDom?.addEventListener(event, clickHandler)
      })
    } else {
      const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${quote.source.id}"]`))
      if (slaxMarks.length === 0) {
        return
      }

      slaxMarks.forEach(slaxMark => {
        slaxMark.classList.add('highlighted')
      })

      const firstSlaxMarks = slaxMarks[0]
      firstSlaxMarks.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

      const clickHandler = () => {
        slaxMarks.forEach(slaxMark => {
          slaxMark.classList.remove('highlighted')
        })

        this.config.monitorDom?.removeEventListener('click', clickHandler)
      }

      this.config.monitorDom?.addEventListener('click', clickHandler)
    }
  }

  private mouseUpHandler(e: MouseEvent | TouchEvent) {
    this.removeMouseListener()
    setTimeout(() => {
      const selectedInfo = this.getSelectedElementsList()
      if (!selectedInfo || selectedInfo.length === 0) {
        this.currentMarkItemInfo.value = null
        return
      }

      const source = this.getMarkPathItems(selectedInfo)
      if (source === null) return

      const markInfoItem = this.markItemInfos.find(infoItem => this.checkMarkSourceIsSame(infoItem.source, source))
      if (markInfoItem) {
        this.currentMarkItemInfo.value = markInfoItem
        this.showPanel()

        return
      }

      if (this.currentMarkItemInfo.value?.id === '' && this.checkMarkSourceIsSame(this.currentMarkItemInfo.value.source, source)) return

      this.currentMarkItemInfo.value = {
        id: '',
        source,
        comments: [],
        stroke: []
      }

      this.selectContent.value = []
      selectedInfo.forEach(item => {
        const lastContent = this.selectContent.value[this.selectContent.value.length - 1]
        const newContent = {
          type: item.type,
          text: item.type === 'text' ? item.text : '',
          src: item.type === 'image' ? item.src : ''
        }
        newContent.text.replaceAll('\n', '')
        if (lastContent?.type === 'text' && item.type === 'text') {
          lastContent.text += item.text
        } else {
          this.selectContent.value.push(newContent)
        }
      })

      let menusY = 0
      SelectionModal.showMenus({
        container: this.config.containerDom!,
        allowAction: this.config.allowAction,
        event: e,
        callback: (type: MenuType, event: MouseEvent) => {
          if (type === MenuType.Stroke) {
            if (!this.currentMarkItemInfo.value) {
              return
            }
            this.currentMarkItemInfo.value.id = getUUID()
            this.strokeSelection({ info: this.currentMarkItemInfo.value })
          } else if (type === MenuType.Copy) {
            this.copyMarkedText(source, event)
          } else if (type === MenuType.Comment) {
            if (!this.currentMarkItemInfo.value) {
              return
            }

            this.currentMarkItemInfo.value.id = getUUID()
            this.showPanel({ fallbackYOffset: menusY })
          } else if (type === MenuType.Chatbot) {
            if (!this.currentMarkItemInfo.value || !this.config.postQuoteDataHandler) {
              return
            }

            const quote = {
              source: {
                // selection: range
              },
              data: this.createQuote(this.currentMarkItemInfo.value.source)
            } as QuoteData

            const selection = window.getSelection()
            const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined

            const selectedInfo = this.getSelectedElementsList()
            if (!selectedInfo || selectedInfo.length === 0) {
              quote.source.selection = range
            } else {
              const source = this.getMarkPathItems(selectedInfo)
              if (source) {
                quote.source.paths = source
              } else {
                quote.source.selection = range
              }
            }

            this.config.postQuoteDataHandler(quote)
            this.findQuote(quote)
          }

          if (type !== MenuType.Comment) {
            this.clearSelection()
          }
        },
        positionCallback: ({ y }) => {
          menusY = y
        },
        noActionCallback: () => {
          this.currentMarkItemInfo.value = null
          this.selectContent.value = []
        }
      })
    }, 0)
  }

  private showPanel(options?: { fallbackYOffset: number }) {
    if (!this.currentMarkItemInfo.value) {
      return
    }
    SelectionModal.showPanel({
      container: this.config.containerDom!,
      articleDom: this.config.monitorDom!,
      info: this.currentMarkItemInfo.value,
      bookmarkUserId: this.config.ownerUserId,
      allowAction: this.config.allowAction,
      fallbackYOffset: options?.fallbackYOffset || 0,
      actionCallback: (type, meta) => {
        if (type === MenuType.Stroke) {
          this.strokeSelection(meta)
        } else if (type === MenuType.Stroke_Delete) {
          this.deleteStroke(meta.info)
        } else if (type === MenuType.Copy) {
          this.copyMarkedText(meta.info.source, meta.event)
        } else if (type === MenuType.Comment) {
          this.strokeSelection(meta)
        } else if (type === MenuType.Chatbot) {
          if (!this.config.postQuoteDataHandler) {
            return
          }

          const quote = {
            source: {
              id: meta.info.id
            },
            data: this.createQuote(meta.info.source)
          }
          this.config.postQuoteDataHandler(quote)
          this.findQuote(quote)
        }
      },
      commentDeleteCallback: (id, markId) => {
        this.deleteComment(id, markId)
      },
      dismissCallback: () => {
        this.currentMarkItemInfo.value = null
        this.selectContent.value = []
      }
    })
  }

  private removeMouseListener() {
    document.removeEventListener('mouseup', this.monitorHandler)
    this.config.monitorDom?.removeEventListener('mouseenter', this.mouseEnterHandler)
    this.config.monitorDom?.removeEventListener('mouseleave', this.mouseLeaveHandler)
  }

  private getSelectedElementsList() {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return []

    const range = selection.getRangeAt(0)
    const selectedInfo: SelectTextInfo[] = []

    function isNodeFullyInRange(node: Node): boolean {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      return range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
    }

    function isNodePartiallyInRange(node: Node): boolean {
      return range.intersectsNode(node)
    }

    function processTextNode(textNode: Text): void {
      if (!isNodePartiallyInRange(textNode)) {
        return
      }

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

    function processNode(node: Node): void {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node as Text)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.tagName === 'IMG' && isNodeFullyInRange(element)) {
          selectedInfo.push({
            type: 'image',
            src: (element as HTMLImageElement).src,
            ele: element
          })
        }

        if (isNodePartiallyInRange(element)) {
          for (const child of element.childNodes) {
            processNode(child)
          }
        }
      }
    }

    function checkAllInfoIsEmpty(info: SelectTextInfo[]): boolean {
      return info.every(item => item.type === 'text' && item.text.trim().length === 0)
    }

    processNode(range.commonAncestorContainer)

    return selectedInfo.length > 0 && !checkAllInfoIsEmpty(selectedInfo) ? selectedInfo : []
  }

  private getMarkPathItems(infos: SelectTextInfo[]) {
    const markItems: MarkPathItem[] = []

    const ele = this.config.monitorDom?.querySelector(`.html-text`)
    for (const info of infos) {
      if (info.type === 'text') {
        const selector = getElementFullSelector(info.node!.parentElement!, ['slax-mark'], ele!)
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) {
          // 出现了null，代表存在不在当前文章内的元素
          return null
        }

        const nodes = this.getAllTextNodes(baseElement)
        const nodeLengths = nodes.map(node => (node.textContent || '').length)

        const nodeIndex = nodes.indexOf(info.node as Node)
        if (nodeIndex === -1) {
          continue
        }

        const base = nodeLengths.slice(0, nodeIndex).reduce((acc, cur) => acc + cur, 0)
        markItems.push({
          type: 'text',
          path: selector,
          start: base + info.startOffset,
          end: base + info.endOffset
        })
      } else if (info.type === 'image') {
        // 这里直接获取图片元素本身的位置
        const selector = getElementFullSelector(info.ele as HTMLElement, ['slax-mark'], ele!)
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) {
          // 出现了null，代表存在不在当前文章内的元素
          return null
        }

        markItems.push({
          type: 'image',
          path: selector
        })
      }
    }

    return markItems
  }

  findCommentById(tagetId: number, infoItem: MarkItemInfo): MarkCommentInfo | null {
    for (const item of infoItem.comments) {
      if (item.markId === tagetId) {
        return item
      }
      for (const child of item.children) {
        if (child.markId === tagetId) {
          return child
        }
      }
    }
    return null
  }

  // 划线功能
  async strokeSelection(meta: StrokeSelectionMeta) {
    const { info, comment, replyToId } = meta
    const markItems: MarkPathItem[] = info.source
    const userInfo = useUserStore().userInfo

    if (info?.stroke.find(item => item.userId === userInfo?.userId) && !comment) {
      return info.id
    }

    const infoItem = info
    const replyToComment = replyToId && replyToId !== 0 ? this.findCommentById(replyToId, infoItem) : null
    const commentItem: MarkCommentInfo | null = comment
      ? {
          markId: 0,
          comment,
          userId: userInfo?.userId || 0,
          username: userInfo?.name || '',
          avatar: userInfo?.picture || '',
          isDeleted: false,
          rootId: 0,
          reply: replyToId
            ? {
                id: replyToId,
                username: replyToComment?.username || '',
                userId: replyToComment?.userId || 0,
                avatar: replyToComment?.avatar || ''
              }
            : undefined,
          createdAt: new Date(),
          children: [],
          showInput: false,
          loading: true
        }
      : null

    const isUpdate = !replyToId && !!this.markItemInfos.find(item => item.id === infoItem.id)
    if (!isUpdate) {
      this.markItemInfos.push(infoItem)
    }

    if (commentItem) {
      if (replyToId) {
        const rootComment = infoItem.comments.find(item => {
          if (item.markId === replyToId) {
            return true
          }

          return !!item.children.find(child => child.markId === replyToId)
        })

        if (rootComment) {
          rootComment.children.push(commentItem!)
        }
      } else {
        infoItem.comments.push(commentItem)
      }
    } else {
      infoItem.stroke.push({ mark_id: 0, userId: userInfo?.userId || 0 })
    }

    const markType = commentItem ? (replyToId ? MarkType.REPLY : MarkType.COMMENT) : MarkType.LINE
    this.drawMarkSelection(infoItem, isUpdate ? 'update' : 'create')

    this.saveMarkSelectContent(markItems, markType, comment, replyToId).then(res => {
      if (!res) {
        Toast.showToast({
          text: commentItem ? t('component.article_selection.comment_failed') : t('component.article_selection.stroke_failed'),
          type: ToastType.Error
        })

        if (commentItem) {
          if (replyToId) {
            const rootComment = infoItem.comments.find(item => {
              if (item.markId === replyToId) {
                return true
              }

              return !!item.children.find(child => child.markId === replyToId)
            })

            if (rootComment) {
              const index = rootComment.children.findIndex(item => objectDeepEqual(item, commentItem))
              if (index !== -1) {
                rootComment.children.splice(index, 1)
              }
            }
          } else {
            const index = infoItem.comments.findIndex(item => objectDeepEqual(item, commentItem))
            if (index !== -1) {
              infoItem.comments.splice(index, 1)
            }
          }
        } else {
          infoItem.stroke = [...infoItem.stroke.filter(item => item.mark_id !== 0)]
        }

        this.drawMarkSelection(infoItem, 'update')
        return
      }

      if (commentItem) {
        commentItem.loading = false
        commentItem.markId = res.mark_id
        commentItem.rootId = res.root_id
        infoItem.comments = infoItem.comments.concat([])
      } else {
        infoItem.stroke = [...infoItem.stroke.filter(item => item.userId !== userInfo?.userId && !!item.mark_id), { mark_id: res.mark_id, userId: userInfo?.userId || 0 }]
      }

      this.drawMarkSelection(infoItem, 'update')
    })

    return infoItem.id
  }

  // 删除划线
  private async deleteStroke(info: MarkItemInfo) {
    const userId = useUserStore().userInfo?.userId || 0
    if (!userId) {
      return
    }

    const markId = info.stroke.find(item => item.userId === userId)?.mark_id
    if (!markId) {
      return
    }

    await request.post({
      url: RESTMethodPath.DELETE_MARK,
      body: {
        bm_id: this.config.bookmarkId,
        mark_id: markId
      }
    })

    info.stroke = [...info.stroke.filter(item => item.userId !== userId)]

    const emptyStrokeAndComment = info.stroke.length === 0 && info.comments.length === 0
    if (emptyStrokeAndComment) {
      const index = this.markItemInfos.findIndex(infoItem => infoItem.id === info.id)
      this.markItemInfos.splice(index, 1)
    }

    const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${info.id}"]`))
    slaxMarks.forEach(mark => {
      if (emptyStrokeAndComment) {
        removeOuterTag(mark)
      } else {
        if (info.stroke.length === 0) {
          mark.classList.remove('stroke')
        }

        // 能删除划线那么就一定是自己的划线，所以不用判断
        mark.classList.remove('self-stroke')
      }
    })
  }

  private async deleteComment(id: string, markId: number) {
    // 找到评论的划线对象
    const markInfoItem = id === this.currentMarkItemInfo.value?.id ? this.currentMarkItemInfo.value : this.markItemInfos.find(infoItem => infoItem.id === id)
    if (!markInfoItem || !markInfoItem.comments) {
      return
    }
    const removeMarkOrComment = () => {
      for (const [idx, topLevelComment] of markInfoItem.comments.entries()) {
        if (topLevelComment.markId === markId) {
          const keepMarks = !!topLevelComment.children.find(item => !item.isDeleted)
          if (keepMarks) {
            markInfoItem.comments[idx].isDeleted = true
          } else {
            markInfoItem.comments.splice(idx, 1)
            const index = this.markItemInfos.findIndex(infoItem => infoItem.id === id)
            this.markItemInfos.splice(index, 1)
            const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${id}"]`))
            slaxMarks.forEach(mark => {
              if (markInfoItem.comments.length === 0) {
                removeOuterTag(mark)
              } else {
                mark.classList.remove('comment')
              }
            })
          }
          return
        }
        for (const child of topLevelComment.children) {
          if (child.markId === markId) {
            child.isDeleted = true
            return
          }
        }
      }
    }
    request
      .post<string>({
        url: RESTMethodPath.DELETE_MARK,
        body: {
          bm_id: this.config.bookmarkId,
          mark_id: markId
        }
      })
      .then(() => removeMarkOrComment())
      .catch(e => {
        console.error(e)
      })
  }

  // 复制文本
  private async copyMarkedText(markItems: MarkPathItem[], event?: MouseEvent) {
    const texts: string[] = []
    let lastNode: Node | null = null
    for (const markItem of markItems) {
      const infos = this.transferNodeInfos(markItem)

      for (const info of infos) {
        if (info.type === 'image') {
          continue
        }

        const range = document.createRange()
        range.setStart(info.node, info.start)
        range.setEnd(info.node, info.end)

        if (
          lastNode &&
          lastNode.parentElement?.nextElementSibling !== info.node.parentElement &&
          lastNode?.parentElement?.parentElement?.nextElementSibling !== info.node.parentElement
        ) {
          texts.push('\n')
        }

        texts.push(range.toString())

        if (lastNode !== info.node) {
          lastNode = info.node
        }
      }
    }

    const text = texts.join('')

    copyText(text)

    if (event) {
      CursorToast.showToast({
        text: t('common.tips.copy_content_success'),
        trackDom: event.target as HTMLElement
      })
    } else {
      Toast.showToast({
        text: t('common.tips.copy_content_success'),
        type: ToastType.Success
      })
    }
  }

  private async drawMarkSelection(itemInfo: MarkItemInfo, action: 'create' | 'update' = 'create') {
    return new Promise<string>(resolve => {
      const isSelfStroke = !!itemInfo.stroke.find(item => item.userId === useUserStore().userInfo?.userId)
      const isStroke = itemInfo.stroke.length > 0
      const isComment = itemInfo.comments.length > 0

      if (action === 'create') {
        for (const markItem of itemInfo.source) {
          if (!isStroke && !isComment) {
            continue
          }

          const baseInfo = {
            id: itemInfo.id,
            isStroke,
            isComment,
            isSelfStroke
          } as DrawMarkBaseInfo

          const infos = this.transferNodeInfos(markItem)

          for (const info of infos) {
            if (info.type === 'image') {
              const { ele } = info
              this.addImageMark({ ...baseInfo, ele: ele as HTMLImageElement })

              continue
            }

            const { node, start, end } = info
            this.addMark({ ...baseInfo, node, start, end })
          }
        }
      } else {
        const slaxMarks = Array.from(document.querySelectorAll(`slax-mark[data-uuid="${itemInfo.id}"]`))
        slaxMarks.forEach(mark => {
          if (isStroke) {
            mark.classList.add('stroke')
          } else {
            mark.classList.remove('stroke')
          }

          if (isComment) {
            mark.classList.add('comment')
          } else {
            mark.classList.remove('comment')
          }

          if (isSelfStroke) {
            mark.classList.add('self-stroke')
          } else {
            mark.classList.remove('self-stroke')
          }

          if (!isStroke && !isComment) {
            removeOuterTag(mark)
          }
        })
      }
      resolve(itemInfo.id)
    })
  }

  private transferNodeInfos(markItem: MarkPathItem) {
    const infos: ({ start: number; end: number; node: Node; type: 'text' } | { type: 'image'; ele: Element })[] = []
    if (markItem.type === 'text') {
      const baseElement = this.config.monitorDom?.querySelector(`${markItem.path}`) as HTMLElement

      const nodes = this.getAllTextNodes(baseElement)
      const nodeLengths = nodes.map(node => (node.textContent || '').length)

      let startOffset = markItem.start
      const endOffset = markItem.end

      let base = 0
      for (let i = 0; i < nodeLengths.length; i++) {
        if (base + nodeLengths[i] <= startOffset) {
          base += nodeLengths[i]
          continue
        }

        if (endOffset - base <= nodeLengths[i]) {
          // 如果endOffset在当前节点内，那就只存当前节点的信息，否则还得继续遍历
          infos.push({
            type: 'text',
            start: startOffset - base,
            end: endOffset - base,
            node: nodes[i]
          })

          break
        } else {
          infos.push({
            type: 'text',
            start: startOffset - base,
            end: nodeLengths[i],
            node: nodes[i]
          })

          // 因为这里的节点消耗了一个nodeLengths[i]，因此startOffset需要调整一下
          startOffset += nodeLengths[i] - (startOffset - base)
          base += nodeLengths[i]
        }
      }
    } else if (markItem.type === 'image') {
      let element = this.config.monitorDom?.querySelector(`${markItem.path}`) as HTMLImageElement
      if (!element || !element?.src) {
        const paths = markItem.path.split('>')
        const tailIdx = paths.length - 1
        const newPath = [...paths.slice(0, tailIdx), ' slax-mark ', paths[tailIdx]]
        element = this.config.monitorDom?.querySelector(newPath.join('>')) as HTMLImageElement
      }

      infos.push({
        type: 'image',
        ele: element
      })
    }

    return infos
  }

  private addImageMark(info: { ele: HTMLImageElement } & DrawMarkBaseInfo) {
    const { id, ele, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const mark = document.createElement('slax-mark')
    mark.dataset.uuid = id
    isStroke && mark.classList.add('stroke')
    isComment && mark.classList.add('comment')
    isSelfStroke && mark.classList.add('self-stroke')
    isHighlighted && mark.classList.add('highlighted')

    mark.onclick = e => {
      const target = e.target as HTMLElement
      if (!target) {
        return
      }

      this.markClick(target)
      e.stopPropagation()
    }

    ele.parentElement?.insertBefore(mark, ele)
    ele.remove()
    mark.appendChild(ele)
  }

  private addMark(info: { node: Node; start: number; end: number } & DrawMarkBaseInfo) {
    const { id, node, start, end, isStroke, isComment, isSelfStroke, isHighlighted } = info
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    const mark = document.createElement('slax-mark')
    mark.dataset.uuid = id
    isStroke && mark.classList.add('stroke')
    isComment && mark.classList.add('comment')
    isSelfStroke && mark.classList.add('self-stroke')
    isHighlighted && mark.classList.add('highlighted')

    mark.onclick = e => {
      const target = e.target as HTMLElement
      if (!target) {
        return
      }

      this.markClick(target)
    }

    range.surroundContents(mark)
  }

  private markClick(ele: HTMLElement) {
    const id = ele.dataset.uuid
    if (!id) {
      return
    }

    const infoItem = this.markItemInfos.find(infoItem => infoItem.id === id)
    if (!infoItem) {
      return
    }

    this.currentMarkItemInfo.value = infoItem
    this.showPanel()
  }

  private getAllTextNodes(element: HTMLElement) {
    const unsupportTags = ['UNSUPPORT-VIDEO']
    const textNodes: Node[] = []
    const traverse = (node: Node) => {
      // 如果是文本节点，添加到数组
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node)
      } else {
        if (unsupportTags.indexOf(node.nodeName) !== -1) {
          return
        }

        node.childNodes.forEach(child => traverse(child))
      }
    }

    traverse(element)
    return textNodes
  }

  private async saveMarkSelectContent(value: MarkPathItem[], type: MarkType, comment?: string, replyToId?: number) {
    try {
      const res: { mark_id: number; root_id: number } | undefined = await request.post({
        url: RESTMethodPath.ADD_MARK,
        body: {
          share_code: this.config.shareCode,
          bm_id: this.config.bookmarkId,
          comment,
          type,
          source: value,
          parent_id: replyToId,
          select_content: this.selectContent.value
        }
      })

      if (!res) {
        return null
      }

      return res
    } catch (error) {
      console.log(error)
      return null
    }
  }

  private checkMarkSourceIsSame(mark1: MarkPathItem[], mark2: MarkPathItem[]) {
    if (mark1.length !== mark2.length) {
      return false
    }

    for (let i = 0; i < mark1.length; i++) {
      const mark1Item = mark1[i]
      const mark2Item = mark2[i]

      if (mark1Item.type !== mark2Item.type) {
        return false
      } else if (mark1Item.type === 'text' && mark2Item.type === 'text') {
        if (mark1Item.path !== mark2Item.path || mark1Item.start !== mark2Item.start || mark1Item.end !== mark2Item.end) {
          return false
        }
      } else if (mark1Item.type === 'image' && mark2Item.type === 'image') {
        if (mark1Item.path !== mark2Item.path && mark1Item.path.replace(/(\s*>\s*|)\s*img\s*$/, '') !== mark2Item.path.replace(/(\s*>\s*|)\s*img\s*$/, '')) {
          const ele1 = this.config.monitorDom?.querySelector(`${mark1Item.path}`) as HTMLImageElement
          const ele2 = this.config.monitorDom?.querySelector(`${mark2Item.path}`) as HTMLImageElement

          if (ele1 !== ele2) {
            return false
          }
        }
      }
    }

    return true
  }

  private createQuote(items: MarkPathItem[]) {
    return items.map(item => {
      if (item.type === 'image') {
        const infos = this.transferNodeInfos(item)
        let content = ''
        if (infos.length > 0 && infos[0].type === 'image') {
          const info = infos[0]
          content = info.type === 'image' ? (info.ele as HTMLImageElement).src : ''
        }

        return { type: 'image', content }
      }

      const infos = this.transferNodeInfos(item)
      const text = infos
        .map(info => {
          if (info.type === 'image') {
            return ''
          }

          const range = document.createRange()
          range.setStart(info.node, info.start)
          range.setEnd(info.node, info.end)

          return range.toString()
        })
        .join('')
      return { type: 'text', content: text }
    }) as QuoteData['data']
  }

  private clearSelection() {
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges() // 移除所有的选择范围
    }

    this.currentMarkItemInfo.value = null
    this.selectContent.value = []
  }

  get isMonitoring() {
    return this._isMonitoring
  }
}
