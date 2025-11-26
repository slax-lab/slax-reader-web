import type { FetchOptions } from '@commons/utils/request'
import { request } from '#layers/core/utils/request'

import type { IHttpClient } from '@slax-reader/selection/adapters'

/**
 * Dweb端HTTP客户端
 *
 * 使用request()组合式函数
 */
export class DwebHttpClient implements IHttpClient {
  async post<T = unknown>(options: FetchOptions): Promise<T | undefined> {
    return await request().post<T>(options)
  }

  async get<T = unknown>(options: FetchOptions): Promise<T | undefined> {
    return await request().get<T>(options)
  }

  async put<T = unknown>(options: FetchOptions): Promise<T | undefined> {
    return await request().put<T>(options)
  }

  async delete<T = unknown>(options: FetchOptions): Promise<T | undefined> {
    return await request().delete<T>(options)
  }
}
