import type { AuthService } from './authService'
import { CONFIG } from './config'
import { UserIndexedDBService } from './indexedDB'
import type { StorageService } from './storageService'
import type { BookmarkActionChange, BookmarkChange, BookmarkDBChange } from './types'
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkChangelog, BookmarkChangelogResp, UserBookmarkChangelog } from '@commons/types/interface'
import md5 from 'md5'

export class BookmarkService {
  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {}

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

      const time = res.end_time
      const logs = res.logs || []

      await this.addBookmarkChanges(
        logs.map(item => ({
          hashUrl: md5(item.target_url),
          bookmarkId: item.bookmark_id
        }))
      )

      const syncTime = Number(time)
      syncTime && (await this.updatechangeSyncTime(syncTime))
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
      const endTime = (await this.querychangeSyncTime()) || 0

      if (endTime && Date.now() - endTime > CONFIG.FULL_SYNC_BOOKMARK_CHANGES_DAYS * 24 * 60 * 60 * 1000) {
        // 超过15天，直接全量更新一次
        await this.updateAllBookmarkChanges()
        return
      }

      const res = await request.get<BookmarkChangelogResp<UserBookmarkChangelog>>({
        url: RESTMethodPath.PARTIAL_BOOKMARK_CHANGES,
        query: {
          end_time: endTime
        }
      })

      if (!res) return

      const time = res.end_time
      const logs = res.logs || []

      await this.addBookmarkActionChanges(
        logs.reverse().map(item => ({
          hashUrl: md5(item.target_url),
          bookmarkId: item.bookmark_id,
          action: item.log_action
        }))
      )

      const syncTime = Number(time)
      syncTime && (await this.updatechangeSyncTime(syncTime))
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
}
