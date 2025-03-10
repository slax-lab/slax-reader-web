export enum MessageTypeAction {
  QueryHTMLContent = 'query-html-content',
  OpenWelcome = 'open-welcome-tab',
  ShowCollectPopup = 'show-collect-popup',
  HideCollectPopup = 'hide-collect-popup',
  RecordBookmark = 'record-bookmark'
}

export type MessageType =
  | {
      action: MessageTypeAction.QueryHTMLContent | MessageTypeAction.ShowCollectPopup | MessageTypeAction.HideCollectPopup | MessageTypeAction.OpenWelcome
    }
  | {
      action: MessageTypeAction.RecordBookmark
      url: string
      actionType: BookmarkActionType
    }

export enum BookmarkActionType {
  ADD = 0,
  DELETE = 1
}
