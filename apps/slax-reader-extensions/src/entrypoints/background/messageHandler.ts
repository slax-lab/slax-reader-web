import { BookmarkActionType, type MessageType, MessageTypeAction } from '@/config'

import type { AuthService } from './authService'
import type { BookmarkService } from './bookmarkService'
import { BrowserService } from './browserService'
import type { StorageService } from './storageService'
import md5 from 'md5'

export class MessageHandler {
  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private bookmarkService: BookmarkService
  ) {}

  handleMessage(message: unknown, sender: Browser.runtime.MessageSender, sendResponse: (response?: unknown) => void) {
    const receiveMessage = message as MessageType

    switch (receiveMessage.action) {
      case MessageTypeAction.OpenWelcome:
        BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
        return false

      case MessageTypeAction.RecordBookmark:
        this.handleRecordBookmark(receiveMessage, sender)
        return false

      case MessageTypeAction.QueryBookmarkRecord:
        this.handleQueryBookmarkRecord(receiveMessage, sendResponse)
        return true

      case MessageTypeAction.AddBookmarkRecord:
        this.handleAddBookmarkRecord(receiveMessage, sendResponse)
        return true

      case MessageTypeAction.CheckLogined:
        this.handleCheckLogined(sendResponse)
        return true

      case MessageTypeAction.QueryUserInfo:
        this.handleQueryUserInfo(sendResponse)
        return true
    }

    return false
  }

  private async handleRecordBookmark(message: Extract<MessageType, { action: MessageTypeAction.RecordBookmark }>, sender: Browser.runtime.MessageSender): Promise<void> {
    try {
      if (sender.tab?.id) {
        await this.bookmarkService.checkAndUpdateBookmarkStatus(sender.tab.id, message.url)
      }
    } catch (error) {
      console.error('Error handling record bookmark:', error)
    }
  }

  private async handleQueryBookmarkRecord(
    message: Extract<MessageType, { action: MessageTypeAction.QueryBookmarkRecord }>,
    sendResponse: (response?: unknown) => void
  ): Promise<boolean> {
    try {
      const url = message.url
      const hashCode = md5(url)
      const bookmarkId = await this.bookmarkService.queryBookmarkRecord(hashCode)

      if (bookmarkId === 0) {
        sendResponse({ success: false })
      } else {
        sendResponse({ success: true, data: { bookmarkId } })
      }
    } catch (error) {
      console.error('Error querying bookmark record:', error)
      sendResponse({ success: false, data: error })
    }

    return true
  }

  private async handleAddBookmarkRecord(
    message: Extract<MessageType, { action: MessageTypeAction.AddBookmarkRecord }>,
    sendResponse: (response?: unknown) => void
  ): Promise<boolean> {
    try {
      const url = message.url
      const bookmarkId = message.bookmarkId
      const hashUrl = md5(url)

      await this.bookmarkService.addBookmarkRecords([{ hashUrl, bookmarkId }])
      sendResponse({ success: true })
    } catch (error) {
      console.error('Error adding bookmark record:', error)
      sendResponse({ success: false, data: error })
    }

    return true
  }

  private async handleCheckLogined(sendResponse: (response?: unknown) => void): Promise<boolean> {
    try {
      const isLoggedIn = await this.authService.checkLogin()
      sendResponse({ success: isLoggedIn, data: isLoggedIn })
    } catch (error) {
      console.error('Error checking login status:', error)
      sendResponse({ success: false, data: error })
    }

    return true
  }

  private async handleQueryUserInfo(sendResponse: (response?: unknown) => void): Promise<boolean> {
    try {
      const userInfo = await this.authService.queryUserInfo()
      sendResponse({ success: true, data: userInfo })
    } catch (error) {
      console.error('Error querying user info:', error)
      sendResponse({ success: false, data: error })
    }

    return true
  }
}
