export enum MessageTypeAction {
  QueryHTMLContent = 'query-html-content',
  OpenWelcome = 'open-welcome-tab',
  ShowCollectPopup = 'show-collect-popup',
  HideCollectPopup = 'hide-collect-popup',
  RecordBookmark = 'record-bookmark',
  QueryBookmarkChange = 'query-bookmark-change',
  AddBookmarkChange = 'add-bookmark-change',
  CheckLogined = 'check-logined',
  QueryUserInfo = 'query-user-info'
}

export type MessageType =
  | {
      action:
        | MessageTypeAction.QueryHTMLContent
        | MessageTypeAction.ShowCollectPopup
        | MessageTypeAction.HideCollectPopup
        | MessageTypeAction.OpenWelcome
        | MessageTypeAction.CheckLogined
        | MessageTypeAction.QueryUserInfo
    }
  | {
      action: MessageTypeAction.RecordBookmark
      url: string
      actionType: BookmarkActionType
    }
  | {
      action: MessageTypeAction.QueryBookmarkChange
      url: string
    }
  | {
      action: MessageTypeAction.AddBookmarkChange
      url: string
      bookmarkId: number
    }

export enum BookmarkActionType {
  ADD = 0,
  DELETE = 1
}
