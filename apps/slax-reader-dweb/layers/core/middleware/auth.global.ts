import { isServer } from '@commons/utils/is'

import { useCookies } from '@vueuse/integrations/useCookies.mjs'

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
  const authWhiteList = ['/privacy', '/terms', '/guide', '/s', '/download', '/contact']
  const isToAuthWhiteList = authWhiteList.some(path => to.fullPath.indexOf(path) !== -1)

  const homepagePaths = ['/', '/zh', '/en']
  const isToHomepage = homepagePaths.includes(to.path)
  const isFromHomepage = homepagePaths.includes(from.path)

  const ignoreAuth = isToHomepage || isToAuthWhiteList
  const needAuth = get ? !get(useNuxtApp().$config.public.COOKIE_TOKEN_NAME) : true

  if (needAuth) {
    if (!ignoreAuth) {
      if (!isToLogin && !isFromAuth) {
        const homepageTrigger = to.query.from === 'homepage'

        const queryParams: Record<string, string> = {}
        if (homepageTrigger) {
          queryParams.from = 'homepage'
        }

        if (!isFromHomepage) {
          queryParams.redirect = encodeURIComponent(to.fullPath ? `${location.origin}${to.fullPath}` : location?.href)
        }

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
