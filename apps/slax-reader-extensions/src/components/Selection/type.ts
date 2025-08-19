import type { QuoteData } from '../Chat/type'
import type { MarkPathApprox, MarkPathItem, UserInfo } from '@commons/types/interface'

export enum MenuType {
  Copy = 'copy',
  Stroke = 'stroke',
  Stroke_Delete = 'stroke_delete',
  Comment = 'comment',
  Chatbot = 'chatbot'
}

export interface MarkItemInfo {
  id: string
  source: MarkPathItem[]
  stroke: { mark_id?: number; userId: number }[]
  comments: MarkCommentInfo[]
  approx: MarkPathApprox
}

export type MarkCommentInfo = {
  markId: number
  comment: string
  userId: number
  username: string
  avatar: string
  isDeleted: boolean
  reply?: {
    username: string
    userId: number
    id: number
    avatar: string
  }
  rootId?: number
  createdAt: Date
  children: MarkCommentInfo[]
} & {
  // 针对界面相关的控制属性
  showInput: boolean
  loading: boolean
  operateLoading: boolean
}

export interface SelectionConfig {
  containerDom: HTMLDivElement | null
  monitorDom: HTMLDivElement | null
  allowAction: boolean
  userInfo: UserInfo | null
  bookmarkIdQuery: () => Promise<number>
  postQuoteDataHandler: (data: QuoteData) => void
  markCommentSelectHandler?: (comment: MarkCommentInfo) => void
  menusCommentHandler?: (info: MarkItemInfo, data: QuoteData['data']) => void
}

export interface StrokeSelectionMeta {
  info: MarkItemInfo
  comment?: string
  replyToId?: number
}

export interface DrawMarkBaseInfo {
  id: string
  isStroke: boolean
  isComment: boolean
  isSelfStroke: boolean
  isHighlighted?: boolean
}

export type SelectTextInfo =
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
