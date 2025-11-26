/**
 * 书签ID提供者适配器接口
 *
 * 用于统一dweb和extensions获取书签ID的方式
 * - dweb: 直接从config传入
 * - extensions: 通过异步查询函数获取
 */
export interface IBookmarkProvider {
  /**
   * 获取当前书签ID
   * @returns 书签ID的Promise
   */
  getBookmarkId(): Promise<number>

  /**
   * 获取分享码（可选，dweb特有）
   * @returns 分享码，如果不存在返回undefined
   */
  getShareCode?(): string | undefined

  /**
   * 获取收藏信息（可选，dweb特有）
   * @returns 收藏信息，如果不存在返回undefined
   */
  getCollectionInfo?(): { code: string; cb_id: number } | undefined

  /**
   * 获取所有者用户ID（可选，dweb特有）
   * @returns 所有者用户ID，如果不存在返回undefined
   */
  getOwnerUserId?(): number | undefined
}
