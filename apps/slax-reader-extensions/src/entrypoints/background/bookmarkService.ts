import { SlaxWebSocket } from '@commons/utils/socket'

import type { AuthService } from './authService'
import { BrowserService } from './browserService'
import { CONFIG } from './config'
import { UserIndexedDBService } from './indexedDB'
import type { StorageService } from './storageService'
import type { BookmarkActionChange, BookmarkChange, BookmarkDBChange, BookmarkSocketData } from './types'
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkActionChangelog, BookmarkChangelog, BookmarkChangelogResp } from '@commons/types/interface'
import { useDebounceFn, type UseDebounceFnReturn } from '@vueuse/core'
import md5 from 'md5'

export class BookmarkService {
  private socket: SlaxWebSocket | null = null
  private tmpNotifyUrlCaches: string[] = []
  private debounceNotifyTabs: UseDebounceFnReturn<() => void>

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.debounceNotifyTabs = useDebounceFn(
      () => {
        this.notfifyTabs()
      },
      500,
      { maxWait: 5000 }
    )
  }

  async updateAllBookmarkChanges(): Promise<void> {
    if (!(await this.storageService.getToken())) {
      return
    }

    const dbService = new UserIndexedDBService()

    try {
      const res = await request.get<BookmarkChangelogResp<BookmarkChangelog>>({
        url: RESTMethodPath.ALL_BOOKMARK_CHANGES
      })

      if (!res) {
        return
      }

      await dbService.initialize()
      await dbService.clearBookmarkChanges()

      const time = res.previous_sync
      const logs = res.logs || []

      await this.addBookmarkChanges(
        logs.map(item => ({
          hashUrl: md5(item.target_url),
          bookmarkId: item.bookmark_id
        }))
      )

      // hook: When all changes, must to update sync time
      const syncTime = Number(time) || Date.now()
      await this.updatechangeSyncTime(syncTime)
    } catch (error) {
      console.error('Error updating all bookmark changes:', error)
    } finally {
      await dbService.close()
    }
  }

  async updatePartialBookmarkChanges(): Promise<void> {
    if (!(await this.storageService.getToken())) {
      return
    }

    try {
      const previousSync = (await this.querychangeSyncTime()) || 0

      if (previousSync && Date.now() - previousSync > CONFIG.FULL_SYNC_BOOKMARK_CHANGES_DAYS * 24 * 60 * 60 * 1000) {
        // 超过15天，直接全量更新一次
        await this.updateAllBookmarkChanges()
        return
      }

      const res = await request.get<BookmarkChangelogResp<BookmarkActionChangelog>>({
        url: RESTMethodPath.PARTIAL_BOOKMARK_CHANGES,
        query: {
          previous_sync: previousSync
        }
      })

      if (!res) return

      const time = res.previous_sync
      const logs = res.logs || []

      await this.addBookmarkActionChanges(
        logs.reverse().map(item => ({
          hashUrl: md5(item.target_url),
          bookmarkId: item.bookmark_id,
          action: item.action
        }))
      )

      const syncTime = Number(time)
      syncTime && (await this.updatechangeSyncTime(syncTime))

      this.notifyUrl(logs.map(item => item.target_url))
    } catch (error) {
      console.error('Error updating partial bookmark changes:', error)
    }
  }

  async querychangeSyncTime(): Promise<number | null> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return null
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()
      const time = await dbService.getLastSyncTime(userInfo.userId)
      return time || 0
    } catch (error) {
      console.error('Error querying change sync time:', error)
      return null
    } finally {
      await dbService.close()
    }
  }

  async updatechangeSyncTime(time: number): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()
      await dbService.updateLastSyncTime(userInfo.userId, time)
    } catch (error) {
      console.error('Error updating change sync time:', error)
    } finally {
      await dbService.close()
    }
  }

  async queryBookmarkChange(hashUrl: string): Promise<number> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return 0
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()
      const change = await dbService.getBookmarkChange(userInfo.userId, hashUrl)
      return change ? change.bookmark_id : 0
    } catch (error) {
      console.error('Error querying bookmark change:', error)
      return 0
    } finally {
      await dbService.close()
    }
  }

  async addBookmarkChanges(changes: BookmarkChange[]): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()
      const dbchanges: BookmarkDBChange[] = changes.map(change => ({
        user_id: userInfo.userId,
        bookmark_id: change.bookmarkId,
        hash_url: change.hashUrl
      }))
      await dbService.saveBookmarkChanges(dbchanges)
    } catch (error) {
      console.error('Error adding bookmark changes:', error)
    } finally {
      await dbService.close()
    }
  }

  async deleteBookmarkChanges(hashUrls: string[]): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    const dbService = new UserIndexedDBService()
    try {
      await dbService.initialize()
      await dbService.deleteBookmarkChanges(
        hashUrls.map(hashUrl => ({
          user_id: userInfo.userId,
          hash_url: hashUrl
        }))
      )
    } catch (error) {
      console.error('Error deleting bookmark changes:', error)
    } finally {
      await dbService.close()
    }
  }

  async addBookmarkActionChanges(changes: BookmarkActionChange[]): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()

      const adds: { user_id: number; bookmark_id: number; hash_url: string }[] = []
      const deletes: { user_id: number; hash_url: string }[] = []

      const executeAll = async () => {
        // 讲队列里存在的处理全部做了

        if (adds.length > 0) {
          await dbService.saveBookmarkChanges(adds)
          adds.length = 0
        }

        if (deletes.length > 0) {
          await dbService.deleteBookmarkChanges(deletes)
          deletes.length = 0
        }
      }

      // 减少事务的操作次数
      for (const item of changes) {
        if (item.action === 'add' || item.action === 'update') {
          if (deletes.length > 0) {
            await dbService.deleteBookmarkChanges(deletes)
            deletes.length = 0
          }

          adds.push({
            user_id: userInfo.userId,
            bookmark_id: item.bookmarkId,
            hash_url: item.hashUrl
          })
        } else if (item.action === 'delete') {
          if (adds.length > 0) {
            await dbService.saveBookmarkChanges(adds)
            adds.length = 0
          }

          deletes.push({
            user_id: userInfo.userId,
            hash_url: item.hashUrl
          })
        } else {
          await executeAll()
        }
      }

      await executeAll()
    } catch (error) {
      console.error('Error adding bookmark changes:', error)
    } finally {
      await dbService.close()
    }
  }

  async deleteBookmarkChange(hashUrl: string): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    const dbService = new UserIndexedDBService()

    try {
      await dbService.initialize()
      await dbService.deleteBookmarkChange(userInfo.userId, hashUrl)
    } catch (error) {
      console.error('Error deleting bookmark change:', error)
    } finally {
      await dbService.close()
    }
  }

  async checkAndUpdateBookmarkStatus(tabId: number, url: string): Promise<void> {
    if (!tabId) {
      return
    }

    try {
      const bookmarkId = await this.queryBookmarkChange(md5(url))
      let text = bookmarkId > 0 ? '✓' : ''
      await browser.action.setBadgeText({ text, tabId })
    } catch (error) {
      console.error(`Error updating bookmark status for tab ${tabId}:`, error)
    }
  }

  async clearBookmarkData() {
    const dbService = new UserIndexedDBService()
    try {
      await dbService.initialize()
      await dbService.clearAllData()
    } catch (error) {
      console.error('Error clearing bookmark data:', error)
    } finally {
      await dbService.close()
    }
  }

  async enableSocket() {
    const token = await this.storageService.getToken()
    if (!token) {
      console.warn('No token found for WebSocket connection')
      return
    }

    if (this.socket) {
      console.warn('WebSocket connection already exists')
      return
    }

    console.log('Enabling WebSocket connection...')

    const baseUrl = process.env.EXTENSIONS_API_BASE_URL || ''
    const socketBastUrl = baseUrl.replace('https', 'wss').replace('http', 'ws')
    const socketUrl = `${socketBastUrl}${RESTMethodPath.CONNECT_BOOKMARK_CHANGES}?token=${token}`

    this.socket = new SlaxWebSocket({
      url: socketUrl,
      autoReconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: 3
    })

    this.socket.on('open', event => {
      console.log('Connection established!')
    })

    this.socket.on('message', async event => {
      console.log('Received message:', event.data)
      const data = JSON.parse(event.data) as BookmarkSocketData
      if (!data) {
        return
      }

      if (data.type === 'bookmark_changes') {
        const changelog = data.data
        const syncTime = await this.querychangeSyncTime()
        const createAt = Number(new Date(changelog.created_at))

        let tasks: Promise<unknown>[] = []
        if (syncTime && createAt > syncTime) {
          tasks.push(this.updatechangeSyncTime(createAt))

          if (changelog.action === 'add' || changelog.action === 'update') {
            tasks.push(this.addBookmarkChanges([{ hashUrl: md5(changelog.target_url), bookmarkId: changelog.bookmark_id }]))
          } else if (changelog.action === 'delete') {
            tasks.push(this.deleteBookmarkChanges([md5(changelog.target_url)]))
          }
        }

        tasks.length > 0 && (await Promise.allSettled(tasks))

        this.notifyUrl([changelog.target_url])
      }
    })

    this.socket.on('error', event => {
      console.error('WebSocket error occurred')
    })

    this.socket.on('close', event => {
      console.log(`Connection closed. Code: ${event.code}, Reason: ${event.reason}`)
    })

    this.socket.on('reconnect', event => {
      console.log(`Reconnecting... Attempt: ${event.detail.attempt}`)
    })
  }

  closeSocket() {
    if (!this.socket) {
      return
    }

    this.socket?.close(1000, 'Normal closure')
    this.socket = null
  }

  notifyUrl(urls: string[]) {
    if (!urls || urls.length === 0) {
      return
    }

    this.tmpNotifyUrlCaches = [...new Set([...this.tmpNotifyUrlCaches, ...urls])]
    this.debounceNotifyTabs()
  }

  async notfifyTabs() {
    if (this.tmpNotifyUrlCaches.length === 0) {
      return
    }

    try {
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) {
        if (!tab.id || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) || tab.status !== 'complete') {
          continue
        }

        if (!this.tmpNotifyUrlCaches.includes(tab.url)) {
          continue
        }

        try {
          await BrowserService.notifyBookmarkStatusUpdate(tab)
        } catch (err) {
          console.warn(`Could not send to tab ${tab.id}: ${err}`)
        }
      }
    } catch (err) {
      console.error('Failed to query tabs:', err)
    }

    this.tmpNotifyUrlCaches.length = 0
  }

  async checkSocket() {
    const token = await this.storageService.getToken()
    if (!token && this.socket) {
      await this.closeSocket()
      return
    }

    if (!token) return

    // when not socket or socket is not open, need to reconnect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsConnection = !this.socket || (this.socket && (this.socket as any).readyState !== WebSocket.OPEN)

    if (needsConnection) {
      if (this.socket) {
        this.closeSocket()
      }
      await this.enableSocket()
    }
  }
}
