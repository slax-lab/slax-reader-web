import { FetchRequest, type FetchResult } from '@commons/utils/request'

import { LocalStorageKey } from '@commons/types/const'
import { NOT_LOGIN_ERROR } from '@commons/types/error'

export const request = new FetchRequest({
  baseUrl: `${process.env.EXTENSIONS_API_BASE_URL}`,
  requestInterceptors: async options => {
    const token = await storage.getItem<string>(LocalStorageKey.USER_TOKEN)
    if (!token) {
      return options
    }
    options.headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {})
    }
    return options
  },
  responseInterceptors: async <T = unknown>(response: FetchResult<unknown>) => {
    if (response.status === 401) {
      await storage.removeItem(LocalStorageKey.USER_TOKEN)
      const url = `${process.env.PUBLIC_BASE_URL}/login?from=extension`
      if (window) {
        window.open(url)
      } else if (browser && browser.tabs) {
        browser.tabs.create({ url })
      }

      throw NOT_LOGIN_ERROR
    }

    return response as FetchResult<T>
  },
  errorInterceptors: error => {
    console.log(error)
  }
})
