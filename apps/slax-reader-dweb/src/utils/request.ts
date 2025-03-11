import { isClient } from '@commons/utils/is'
import { type FetchOptions, FetchRequest, type FetchResult, RequestError, RequestMethodType } from '@commons/utils/request'

import { useCookies } from '@vueuse/integrations/useCookies'
import Toast, { ToastType } from '~/components/Toast'

class ServerRequest extends FetchRequest {
  override async fetchRequest(options: FetchOptions) {
    const { url, query, body, headers, method, stream } = options
    if (method !== RequestMethodType.get || stream) {
      throw Error('Server not support other method')
    }

    const result = await fetch(this.combineUrlWithQuery(url, query), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? (body instanceof File ? body : JSON.stringify(body)) : undefined
    })

    return result
  }
}

export const request = new (isClient ? FetchRequest : ServerRequest)({
  baseUrl: () => useNuxtApp().$config.public.DWEB_API_BASE_URL as string,
  requestInterceptors: async options => {
    const token = getUserToken()
    if (token) {
      options.headers = {
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {})
      }
    }
    return options
  },
  responseInterceptors: async <T = unknown>(response: FetchResult<unknown>) => {
    if (response.status === 401) {
      await useAuth().clearAuth()
      await navigateTo('/login')
    }

    return response as FetchResult<T>
  },
  errorInterceptors: error => {
    console.log(error)
    if (error instanceof RequestError && error.message) {
      Toast.showToast({
        text: error.message,
        type: ToastType.Error
      })
    } else {
      Toast.showToast({
        text: `${error}`,
        type: ToastType.Error
      })
    }
  }
})

export const getUserToken = () => {
  const COOKIE_TOKEN_NAME = useNuxtApp().$config.public.COOKIE_TOKEN_NAME

  const getUserTokenClient = () => {
    const cookies = useCookies()
    return cookies.get(COOKIE_TOKEN_NAME)
  }
  const getUserTokenServer = () => {
    const headers = useRequestHeaders(['cookie'])
    const cookieHeader = headers.cookie
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/)
      return tokenMatch ? tokenMatch[1] : undefined
    }
    return undefined
  }
  return isClient ? getUserTokenClient() : getUserTokenServer()
}

export const haveRequestToken = () => {
  return !!getUserToken()
}
