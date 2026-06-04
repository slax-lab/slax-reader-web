import { isServer } from '@commons/utils/is'

import { useCookies } from '@vueuse/integrations/useCookies'

const { get } = useCookies()
export default defineNuxtRouteMiddleware((to, from) => {
  if (isServer) {
    return
  }

  const isAnchorLink = to.path === from.path && to.hash !== from.hash

  if (isAnchorLink) {
    return
  }

  const isFromAuth = from.fullPath.indexOf('/auth') !== -1
  const isToAuth = to.fullPath.indexOf('/auth') !== -1
  const isToLogin = to.fullPath.indexOf('/login') !== -1
  const authWhiteList = ['/privacy', '/terms', '/guide', '/s', '/how-do-i-delete-my-account', '/delete-account-notice']
  const isToAuthWhiteList = authWhiteList.some(path => to.fullPath.indexOf(path) !== -1)

  const ignoreAuth = isToAuthWhiteList
  const needAuth = get ? !get(useRuntimeConfig().public.COOKIE_TOKEN_NAME) : true

  if (needAuth) {
    if (!ignoreAuth) {
      if (!isToLogin && !isFromAuth) {
        const queryParams: Record<string, string> = {}

        queryParams.redirect = encodeURIComponent(to.fullPath ? `${location.origin}${to.fullPath}` : location?.href)

        const queryStr = Object.keys(queryParams)
          .map(key => `${key}=${queryParams[key]}`)
          .join('&')

        return navigateTo(`/login${queryStr ? `?${queryStr}` : ''}`)
      }
    }
  } else {
    if (isToLogin || isToAuth) {
      const redirectUrl = to.query.redirect as string
      if (redirectUrl) {
        return navigateTo(decodeURIComponent(redirectUrl), { external: true })
      }

      return navigateTo('/bookmarks')
    }
  }
})
