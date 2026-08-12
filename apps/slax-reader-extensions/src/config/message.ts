export enum MessageTypeAction {
  QueryHTMLContent = 'query-html-content',
  OpenWelcome = 'open-welcome-tab',
  ShowCollectPopup = 'show-collect-popup',
  HideCollectPopup = 'hide-collect-popup',
  RecordBookmark = 'record-bookmark',
  QueryBookmarkChange = 'query-bookmark-change',
  AddBookmarkChange = 'add-bookmark-change',
  CheckLogined = 'check-logined',
  QueryUserInfo = 'query-user-info',
  PageUrlUpdate = 'page-url-update',
  BookmarkStatusRefresh = 'bookmark-status-refresh',
  QueryPinnedStatus = 'query-pinned-status',
  PinnedStatusUpdate = 'pinned-status-update'
}

export type MessageType =
  | {
      action:
        | MessageTypeAction.QueryHTMLContent
        | MessageTypeAction.ShowCollectPopup
        | MessageTypeAction.HideCollectPopup
        | MessageTypeAction.OpenWelcome
        | MessageTypeAction.CheckLogined
        | MessageTypeAction.BookmarkStatusRefresh
        | MessageTypeAction.QueryPinnedStatus
    }
  | {
      action: MessageTypeAction.PinnedStatusUpdate
      isOnToolbar: boolean
    }
  | ({
      action: MessageTypeAction.RecordBookmark
      url: string
    } & ({ actionType: BookmarkActionType.ADD; bookmarkId: number } | { actionType: BookmarkActionType.DELETE }))
  | {
      action: MessageTypeAction.QueryBookmarkChange
      url: string
    }
  | {
      action: MessageTypeAction.AddBookmarkChange
      url: string
      bookmarkId: number
    }
  | {
      action: MessageTypeAction.PageUrlUpdate
      url: string
    }
  | {
      action: MessageTypeAction.QueryUserInfo
      refresh?: boolean
    }

export enum BookmarkActionType {
  ADD = 0,
  DELETE = 1
}
