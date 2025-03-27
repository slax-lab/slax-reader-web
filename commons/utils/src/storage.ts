// models.ts

// 定义数据模型接口
export interface DataItem {
  id?: number
  title: string
  content: string
  timestamp: number
  tags?: string[]
}

// 定义消息类型
export type MessageAction = 'addData' | 'getData' | 'getAllData' | 'updateData' | 'deleteData' | 'searchData'

// 请求消息接口
export interface RequestMessage {
  action: MessageAction
  data?: unknown
  id?: number
  query?: string
}

// 响应消息接口
export interface ResponseMessage {
  success: boolean
  data?: unknown
  id?: number
  error?: string
}

// 数据库配置
export const DB_CONFIG = {
  name: 'ExtensionDB',
  version: 1,
  stores: {
    data: 'id'
  }
}

export class DatabaseService {
  private dbName: string = DB_CONFIG.name
  private dbVersion: number = DB_CONFIG.version

  /**
   * 打开数据库连接
   */
  public openDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open(this.dbName, this.dbVersion)

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result
        console.log(db)
        // 创建对象存储
        if (!db.objectStoreNames.contains('data')) {
          const store = db.createObjectStore('data', { keyPath: 'id', autoIncrement: true })

          // 创建索引
          store.createIndex('by_title', 'title', { unique: false })
          store.createIndex('by_timestamp', 'timestamp', { unique: false })
          store.createIndex('by_tags', 'tags', { unique: false, multiEntry: true })

          store.transaction.oncomplete = () => {
            console.log('object store created')
          }
        }
      }

      request.onsuccess = (event: Event) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result
        resolve(db)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Database error: ${(event.target as IDBOpenDBRequest).error?.message}`))
      }
    })
  }

  /**
   * 添加数据项
   */
  public async addItem(item: DataItem): Promise<number> {
    const db = await this.openDatabase()

    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readwrite')
      const store = transaction.objectStore('data')

      const request = store.add(item)

      request.onsuccess = (event: Event) => {
        const id = (event.target as IDBRequest<number>).result
        resolve(id)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Add error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }

  /**
   * 获取单个数据项
   */
  public async getItem(id: number): Promise<DataItem | null> {
    const db = await this.openDatabase()

    return new Promise<DataItem | null>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readonly')
      const store = transaction.objectStore('data')

      const request = store.get(id)

      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest<DataItem>).result || null
        resolve(result)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Get error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }

  /**
   * 获取所有数据项
   */
  public async getAllItems(): Promise<DataItem[]> {
    const db = await this.openDatabase()

    return new Promise<DataItem[]>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readonly')
      const store = transaction.objectStore('data')

      const request = store.getAll()

      request.onsuccess = (event: Event) => {
        const items = (event.target as IDBRequest<DataItem[]>).result || []
        resolve(items)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`GetAll error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }

  /**
   * 更新数据项
   */
  public async updateItem(item: DataItem): Promise<boolean> {
    if (!item.id) {
      throw new Error('Item must have an ID to update')
    }

    const db = await this.openDatabase()

    return new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readwrite')
      const store = transaction.objectStore('data')

      const request = store.put(item)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Update error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }

  /**
   * 删除数据项
   */
  public async deleteItem(id: number): Promise<boolean> {
    const db = await this.openDatabase()

    return new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readwrite')
      const store = transaction.objectStore('data')

      const request = store.delete(id)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Delete error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }

  /**
   * 根据标题搜索数据项
   */
  public async searchByTitle(query: string): Promise<DataItem[]> {
    const db = await this.openDatabase()

    return new Promise<DataItem[]>((resolve, reject) => {
      const transaction = db.transaction(['data'], 'readonly')
      const store = transaction.objectStore('data')
      const index = store.index('by_title')

      const request = index.openCursor()
      const results: DataItem[] = []

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor) {
          const item = cursor.value as DataItem
          if (item.title.toLowerCase().includes(query.toLowerCase())) {
            results.push(item)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = (event: Event) => {
        reject(new Error(`Search error: ${(event.target as IDBRequest).error?.message}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  }
}
