import { RESTMethodPath } from '@commons/types/const'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useUserStore } from '#layers/core/stores/user'

const { set, get, remove } = useCookies()

const useAuth = {
  async requestAuth(options: { redirect: string; affCode: string }) {
    const { redirect, affCode } = options
    const $config = useNuxtApp().$config.public
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
    const params = {
      client_id: $config.GOOGLE_OAUTH_CLIENT_ID as string,
      redirect_uri: `${$config.AUTH_BASE_URL}/auth`,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      response_type: 'code',
      state: JSON.stringify({
        nonce: 'random',
        redirectUrl: `${$config.AUTH_BASE_URL}/auth`,
        target: redirect,
        affCode: affCode,
        platform: 'google'
      })
    }

    location.href = url + '?' + new URLSearchParams(params)
  },
  async requestAppleAuth(options: { redirect: string; affCode: string }) {
    const { redirect, affCode } = options
    const $config = useNuxtApp().$config.public
    const url = `https://appleid.apple.com/auth/authorize`
    const params = {
      client_id: $config.APPLE_OAUTH_CLIENT_ID as string,
      redirect_uri: `${$config.AUTH_BASE_URL}/auth`,
      response_type: 'code',
      response_mode: 'query',
      scope: 'name email',
      state: JSON.stringify({
        nonce: 'random',
        redirectUrl: `${$config.AUTH_BASE_URL}/auth`,
        target: redirect,
        affCode: affCode,
        platform: 'apple'
      })
    }

    location.href = url + '?' + new URLSearchParams(params)
  },
  async grantAuth(code: string, redirectUri: string, affCode: string, platform: string = 'google'): Promise<string> {
    const resp = await request().post<{ token: string }>({
      url: RESTMethodPath.LOGIN,
      body: {
        code,
        aff_code: affCode,
        redirect_uri: redirectUri,
        platform: platform
      }
    })
    if (!resp) {
      throw new Error('login failed')
    }

    const $config = useNuxtApp().$config.public
    set($config.COOKIE_TOKEN_NAME, resp.token, { path: '/', expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), domain: `${$config.COOKIE_DOMAIN}` })
    return resp.token
  },
  async clearAuth(): Promise<void> {
    const $config = useNuxtApp().$config.public
    remove($config.COOKIE_TOKEN_NAME, { path: '/', domain: `${$config.COOKIE_DOMAIN}` })
    remove($config.COOKIE_TOKEN_NAME, { path: '/' })
    const userStore = useUserStore()
    userStore.clearUserInfo()

    try {
      checkAndRemoveOriginalCookies()
    } catch (e) {}
  }
}

const checkAndRemoveOriginalCookies = () => {
  const $config = useNuxtApp().$config.public
  const splits = $config.COOKIE_DOMAIN.split('.').filter(token => !!token)
  if (splits.length <= 2) {
    return
  }

  splits[0] = ''
  const domain = splits.slice(1).join('.')
  const oldCookies = get($config.COOKIE_TOKEN_NAME)
  if (oldCookies) {
    // remove original old cookie
    remove($config.COOKIE_TOKEN_NAME, { path: '/', domain: `${domain}` })
  }
}

export default () => useAuth
