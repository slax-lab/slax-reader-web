import { type MessageType, MessageTypeAction } from '@/config'

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

    console.log('Received message:', receiveMessage)

    switch (receiveMessage.action) {
      case MessageTypeAction.OpenWelcome:
        BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
        return false

      case MessageTypeAction.RecordBookmark:
        this.handleRecordBookmark(receiveMessage, sender)
        return false

      case MessageTypeAction.QueryBookmarkChange:
        this.handleQueryBookmarkChange(receiveMessage, sendResponse)
        return true

      case MessageTypeAction.AddBookmarkChange:
        this.handleAddBookmarkChange(receiveMessage, sendResponse)
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
      console.error('Error handling change bookmark:', error)
    }
  }

  private async handleQueryBookmarkChange(message: Extract<MessageType, { action: MessageTypeAction.QueryBookmarkChange }>, sendResponse: (response?: unknown) => void) {
    try {
      const url = message.url
      const hashUrl = md5(url)
      const bookmarkId = await this.bookmarkService.queryBookmarkChange(hashUrl)

      if (bookmarkId === 0) {
        sendResponse({ success: false })
      } else {
        sendResponse({ success: true, data: { bookmarkId } })
      }
    } catch (error) {
      console.error('Error querying bookmark change:', error)
      sendResponse({ success: false, data: error })
    }
  }

  private async handleAddBookmarkChange(message: Extract<MessageType, { action: MessageTypeAction.AddBookmarkChange }>, sendResponse: (response?: unknown) => void) {
    try {
      const url = message.url
      const bookmarkId = message.bookmarkId
      const hashUrl = md5(url)

      await this.bookmarkService.addBookmarkChanges([{ hashUrl, bookmarkId }])
      sendResponse({ success: true })
    } catch (error) {
      console.error('Error adding bookmark change:', error)
      sendResponse({ success: false, data: error })
    }
  }

  private async handleCheckLogined(sendResponse: (response?: unknown) => void) {
    try {
      const isLoggedIn = await this.authService.checkLogin()
      sendResponse({ success: isLoggedIn, data: isLoggedIn })
    } catch (error) {
      console.error('Error checking login status:', error)
      sendResponse({ success: false, data: error })
    }
  }

  private async handleQueryUserInfo(sendResponse: (response?: unknown) => void) {
    try {
      const userInfo = await this.authService.queryUserInfo()
      sendResponse({ success: true, data: userInfo })
    } catch (error) {
      console.error('Error querying user info:', error)
      sendResponse({ success: false, data: error })
    }
  }
}
