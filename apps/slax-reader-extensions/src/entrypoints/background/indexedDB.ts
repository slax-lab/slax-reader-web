/**
 * 书签记录的接口定义
 */
export interface BookmarkChange {
  user_id: number
  hash_url: string
  bookmark_id: number
}

/**
 * 用户配置接口
 */
export interface UserConfig {
  user_id: number // 作为主键
  previous_sync?: number // 上次同步时间戳
  // 未来可能添加的其他配置项
}

/**
 * 操作结果接口
 */
export interface OperationResult {
  success: boolean
  updated?: BookmarkChange[] // 更新的记录
  error?: Error // 其他错误
}

/**
 * IndexedDB 书签服务
 */
export class UserIndexedDBService {
  private readonly DB_NAME = 'BookmarksDatabase'
  private readonly DB_VERSION = 1
  private readonly BOOKMARKS_STORE = 'bookmarks_changes'
  private readonly CONFIG_STORE = 'user_config'
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库连接
   * @returns Promise 解析为操作结果
   */
  public async initialize(): Promise<OperationResult> {
    return new Promise(resolve => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = event => {
        console.error('数据库打开失败:', event)
        resolve({
          success: false,
          error: new Error('无法打开数据库')
        })
      }

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result
        console.log('数据库连接成功')
        resolve({ success: true })
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion

        if (oldVersion < 1) {
          // 首次创建数据库（版本0到版本1）
          if (!db.objectStoreNames.contains(this.BOOKMARKS_STORE)) {
            const store = db.createObjectStore(this.BOOKMARKS_STORE, { keyPath: ['user_id', 'hash_url'] })

            // 创建索引
            store.createIndex('by_hash_url', 'hash_url', { unique: false })
            store.createIndex('by_user_id', 'user_id', { unique: false })
            store.createIndex('by_bookmark_id', 'bookmark_id', { unique: false })

            console.log('书签存储已创建')
          }

          if (!db.objectStoreNames.contains(this.CONFIG_STORE)) {
            db.createObjectStore(this.CONFIG_STORE, { keyPath: 'user_id' })
            console.log('用户配置存储已创建')
          }
        }
      }
    })
  }

  /**
   * 确保数据库已连接
   * @private
   */
  private ensureDbConnected(): OperationResult {
    if (!this.db) {
      return {
        success: false,
        error: new Error('数据库未初始化，请先调用 initialize() 方法')
      }
    }
    return { success: true }
  }

  /**
   * 添加或更新单个书签记录
   * @param bookmark 要添加或更新的书签记录
   * @returns Promise 解析为操作结果
   */
  public async saveBookmarkChange(bookmark: BookmarkChange): Promise<OperationResult> {
    // 如果没有提供时间戳，添加当前时间
    return this.saveBookmarkChanges([bookmark])
  }

  /**
   * 批量添加或更新书签记录
   * @param bookmarks 要添加或更新的书签记录数组
   * @returns Promise 解析为操作结果，包含成功状态和更新的记录
   */
  public async saveBookmarkChanges(bookmarks: BookmarkChange[]): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    // 检查哪些记录已经存在（将被更新）
    const updated: BookmarkChange[] = []
    const toSave: BookmarkChange[] = [...bookmarks]

    // 检查每条记录是否已存在
    for (const bookmark of bookmarks) {
      try {
        const existingRecord = await this.getBookmarkChange(bookmark.user_id, bookmark.hash_url)
        if (existingRecord) {
          updated.push(bookmark)
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        }
      }
    }

    // 保存所有记录
    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readwrite')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)

      transaction.onerror = event => {
        console.error('保存书签事务失败:', event)
        resolve({
          success: false,
          error: new Error('保存书签失败')
        })
      }

      transaction.oncomplete = () => {
        resolve({
          success: true,
          updated: updated.length > 0 ? updated : undefined
        })
      }

      // 逐个保存记录
      toSave.forEach(bookmark => {
        store.put(bookmark)
      })
    })
  }

  /**
   * 获取单个书签记录
   * @param userId 用户ID
   * @param urlHash URL哈希
   * @returns Promise 解析为书签记录或null
   */
  public async getBookmarkChange(userId: number, urlHash: string): Promise<BookmarkChange | null> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      throw dbCheck.error
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readonly')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)
      const request = store.get([userId, urlHash])

      request.onerror = event => {
        reject(new Error('获取书签记录失败'))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * 根据 hash_url 查询书签记录
   * @param urlHash 要查询的 hash_url
   * @returns Promise 解析为操作结果，包含匹配的书签记录
   */
  public async findByUrlHash(urlHash: string): Promise<OperationResult & { records?: BookmarkChange[] }> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readonly')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)
      const index = store.index('by_hash_url')
      const request = index.getAll(urlHash)

      request.onerror = event => {
        console.error('查询书签失败:', event)
        resolve({
          success: false,
          error: new Error('查询书签失败')
        })
      }

      request.onsuccess = () => {
        resolve({
          success: true,
          records: request.result as BookmarkChange[]
        })
      }
    })
  }

  /**
   * 根据 hash_url 删除书签记录
   * @param urlHash 要删除的 hash_url
   * @returns Promise 解析为操作结果
   */
  public async deleteByUrlHash(urlHash: string): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    // 先查找所有匹配的记录
    const findResult = await this.findByUrlHash(urlHash)

    if (!findResult.success) {
      return findResult
    }

    const records = findResult.records || []

    if (records.length === 0) {
      return { success: true } // 没有找到记录，视为删除成功
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readwrite')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)
      let failed = false

      transaction.oncomplete = () => {
        resolve({ success: !failed })
      }

      transaction.onerror = event => {
        console.error('删除书签事务失败:', event)
        resolve({
          success: false,
          error: new Error('删除书签失败')
        })
      }

      // 逐个删除找到的记录
      records.forEach(record => {
        const request = store.delete([record.user_id, record.hash_url])

        request.onerror = event => {
          console.error('删除单个书签记录失败:', event)
          failed = true
        }
      })
    })
  }

  /**
   * 删除单个书签记录
   * @param userId 用户ID
   * @param urlHash URL哈希值
   * @returns Promise 解析为操作结果
   */
  public async deleteBookmarkChange(userId: number, urlHash: string): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readwrite')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)
      const request = store.delete([userId, urlHash])

      request.onerror = event => {
        console.error('删除书签失败:', event)
        resolve({
          success: false,
          error: new Error('删除书签失败')
        })
      }

      request.onsuccess = () => {
        resolve({ success: true })
      }
    })
  }

  /**
   * 批量删除书签记录
   * @param records 要删除的书签记录数组，每个记录需包含 user_id 和 hash_url
   * @returns Promise 解析为操作结果
   */
  public async deleteBookmarkChanges(records: Pick<BookmarkChange, 'user_id' | 'hash_url'>[]): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.BOOKMARKS_STORE, 'readwrite')
      const store = transaction.objectStore(this.BOOKMARKS_STORE)
      let failed = false

      transaction.oncomplete = () => {
        resolve({ success: !failed })
      }

      transaction.onerror = event => {
        console.error('批量删除书签事务失败:', event)
        resolve({
          success: false,
          error: new Error('批量删除书签失败')
        })
      }

      // 逐个删除记录
      records.forEach(record => {
        const request = store.delete([record.user_id, record.hash_url])

        request.onerror = event => {
          console.error('删除单个书签记录失败:', event)
          failed = true
        }
      })
    })
  }

  /**
   * 获取用户配置
   * @param userId 用户ID
   * @returns Promise 解析为用户配置或null
   */
  public async getUserConfig(userId: number): Promise<UserConfig | null> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      throw dbCheck.error
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.CONFIG_STORE, 'readonly')
      const store = transaction.objectStore(this.CONFIG_STORE)
      const request = store.get(userId)

      request.onerror = event => {
        reject(new Error('获取用户配置失败'))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * 保存用户配置
   * @param config 用户配置
   * @returns Promise 解析为操作结果
   */
  public async saveUserConfig(config: UserConfig): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    return new Promise(resolve => {
      const transaction = this.db!.transaction(this.CONFIG_STORE, 'readwrite')
      const store = transaction.objectStore(this.CONFIG_STORE)
      const request = store.put(config)

      request.onerror = event => {
        console.error('保存用户配置失败:', event)
        resolve({
          success: false,
          error: new Error('保存用户配置失败')
        })
      }

      request.onsuccess = () => {
        resolve({ success: true })
      }
    })
  }

  /**
   * 更新上次同步时间
   * @param userId 用户ID
   * @param syncTime 同步时间戳，默认为当前时间
   * @returns Promise 解析为操作结果
   */
  public async updateLastSyncTime(userId: number, syncTime: number = Date.now()): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    // 先获取现有配置
    let config: UserConfig
    try {
      const existingConfig = await this.getUserConfig(userId)
      if (existingConfig) {
        // 更新现有配置
        config = {
          ...existingConfig,
          previous_sync: syncTime
        }
      } else {
        // 创建新配置
        config = {
          user_id: userId,
          previous_sync: syncTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }

    // 保存更新后的配置
    return this.saveUserConfig(config)
  }

  /**
   * 获取上次同步时间
   * @param userId 用户ID
   * @returns Promise 解析为上次同步时间或null
   */
  public async getLastSyncTime(userId: number): Promise<number | null> {
    try {
      const config = await this.getUserConfig(userId)
      return config?.previous_sync || null
    } catch (error) {
      console.error('获取上次同步时间失败:', error)
      return null
    }
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('数据库连接已关闭')
    }
  }

  /**
   * 清除书签数据
   * @returns Promise 解析为操作结果
   */
  public async clearBookmarkChanges(): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    return this.clearStore(this.BOOKMARKS_STORE)
  }

  /**
   * 清除所有数据（书签和用户配置）
   * @returns Promise 解析为操作结果
   */
  public async clearAllData(): Promise<OperationResult> {
    const dbCheck = this.ensureDbConnected()
    if (!dbCheck.success) {
      return dbCheck
    }

    // 创建一个包含所有需要清除的存储的数组
    const storeNames = [this.BOOKMARKS_STORE, this.CONFIG_STORE]
    let hasError = false
    let errorMessage = ''

    // 依次清除每个存储中的数据
    for (const storeName of storeNames) {
      try {
        const clearResult = await this.clearStore(storeName)
        if (!clearResult.success) {
          hasError = true
          errorMessage += `清除 ${storeName} 失败: ${clearResult.error?.message || '未知错误'}; `
        }
      } catch (error) {
        hasError = true
        errorMessage += `清除 ${storeName} 时发生异常: ${error instanceof Error ? error.message : String(error)}; `
      }
    }

    if (hasError) {
      return {
        success: false,
        error: new Error(errorMessage)
      }
    }

    return { success: true }
  }

  /**
   * 清除指定存储中的所有数据
   * @param storeName 存储名称
   * @returns Promise 解析为操作结果
   * @private
   */
  private async clearStore(storeName: string): Promise<OperationResult> {
    return new Promise(resolve => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      transaction.onerror = event => {
        console.error(`清除 ${storeName} 事务失败:`, event)
        resolve({
          success: false,
          error: new Error(`清除 ${storeName} 失败`)
        })
      }

      request.onerror = event => {
        console.error(`清除 ${storeName} 请求失败:`, event)
        resolve({
          success: false,
          error: new Error(`清除 ${storeName} 失败`)
        })
      }

      request.onsuccess = () => {
        console.log(`已清除 ${storeName} 中的所有数据`)
        resolve({ success: true })
      }
    })
  }
}
