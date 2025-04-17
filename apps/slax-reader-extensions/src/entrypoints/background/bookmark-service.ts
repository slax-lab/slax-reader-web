import type { AuthService } from './auth-service'
import { CONFIG } from './config'
import type { UserIndexedDBService } from './db'
import type { StorageService } from './storage-service'
import type { BookmarkDBRecord, BookmarkRecord } from './types'
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkChangelog, BookmarkChangelogResp, UserBookmarkChangelog } from '@commons/types/interface'
import md5 from 'md5'

export class BookmarkService {
  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private dbService: UserIndexedDBService
  ) {}

  async updateAllBookmarkRecords(): Promise<void> {
    if (!(await this.storageService.getToken())) {
      return
    }

    try {
      const res = await request.get<BookmarkChangelogResp<BookmarkChangelog>>({
        url: RESTMethodPath.ALL_BOOKMARK_CHANGELOGS
      })

      if (!res) {
        return
      }

      await this.dbService.initialize()
      await this.dbService.clearBookmarkRecords()

      const time = res.end_time
      const logs = res.logs || []

      await this.addBookmarkRecords(
        logs.map(item => ({
          hashUrl: md5(item.target_url),
          bookmarkId: item.bookmark_id
        }))
      )

      await this.updateRecordSyncTime(Number(time))
    } catch (error) {
      console.error('Error updating all bookmark records:', error)
    } finally {
      await this.dbService.close()
    }
  }

  async updatePartialBookmarkRecords(): Promise<void> {
    if (!(await this.storageService.getToken())) {
      return
    }

    try {
      const endTime = (await this.queryRecordSyncTime()) || 0

      if (endTime && Date.now() - endTime > CONFIG.FULL_SYNC_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) {
        // 超过15天，直接全量更新一次
        await this.updateAllBookmarkRecords()
        return
      }

      const res = await request.get<BookmarkChangelogResp<UserBookmarkChangelog>>({
        url: RESTMethodPath.PARTIAL_BOOKMARK_CHANGELOGS,
        query: {
          end_time: endTime
        }
      })

      if (!res) return

      const time = res.end_time
      const logs = res.logs || []

      for (const item of logs.reverse()) {
        const hashUrl = md5(item.target_url)
        const bookmarkId = item.bookmark_id

        if (item.log_action === 'add' || item.log_action === 'update') {
          await this.addBookmarkRecords([{ hashUrl, bookmarkId }])
        } else if (item.log_action === 'delete') {
          await this.deleteBookmarkRecord(hashUrl)
        }
      }

      await this.updateRecordSyncTime(time)
    } catch (error) {
      console.error('Error updating partial bookmark records:', error)
    }
  }

  async queryRecordSyncTime(): Promise<number | null> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return null
    }

    try {
      await this.dbService.initialize()
      const time = await this.dbService.getLastSyncTime(userInfo.userId)
      return time || 0
    } catch (error) {
      console.error('Error querying record sync time:', error)
      return null
    } finally {
      await this.dbService.close()
    }
  }

  async updateRecordSyncTime(time: number): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    try {
      await this.dbService.initialize()
      await this.dbService.updateLastSyncTime(userInfo.userId, time)
    } catch (error) {
      console.error('Error updating record sync time:', error)
    } finally {
      await this.dbService.close()
    }
  }

  async queryBookmarkRecord(hashUrl: string): Promise<number> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return 0
    }

    try {
      await this.dbService.initialize()
      const record = await this.dbService.getBookmarkRecord(userInfo.userId, hashUrl)
      return record ? record.bookmark_id : 0
    } catch (error) {
      console.error('Error querying bookmark record:', error)
      return 0
    } finally {
      await this.dbService.close()
    }
  }

  async addBookmarkRecords(records: BookmarkRecord[]): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    try {
      await this.dbService.initialize()
      const dbRecords: BookmarkDBRecord[] = records.map(record => ({
        user_id: userInfo.userId,
        bookmark_id: record.bookmarkId,
        url_hash: record.hashUrl
      }))
      await this.dbService.saveBookmarkRecords(dbRecords)
    } catch (error) {
      console.error('Error adding bookmark records:', error)
    } finally {
      await this.dbService.close()
    }
  }

  async deleteBookmarkRecord(hashUrl: string): Promise<void> {
    const userInfo = await this.authService.queryUserInfo()
    if (!userInfo) {
      return
    }

    try {
      await this.dbService.initialize()
      await this.dbService.deleteBookmarkRecord(userInfo.userId, hashUrl)
    } catch (error) {
      console.error('Error deleting bookmark record:', error)
    } finally {
      await this.dbService.close()
    }
  }

  async checkAndUpdateBookmarkStatus(tabId: number, url: string): Promise<void> {
    if (!tabId) {
      return
    }

    try {
      const bookmarkId = await this.queryBookmarkRecord(md5(url))
      let text = bookmarkId > 0 ? '✓' : ''
      await browser.action.setBadgeText({ text, tabId })
    } catch (error) {
      console.error(`Error updating bookmark status for tab ${tabId}:`, error)
    }
  }
}
