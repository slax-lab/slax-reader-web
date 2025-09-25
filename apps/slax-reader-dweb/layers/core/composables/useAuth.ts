import { RESTMethodPath } from '@commons/types/const'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useUserStore } from '#layers/core/stores/user'

const { set, remove } = useCookies()

const useAuth = {
  async requestAuth(options: { redirect: string; affCode: string }) {
    const { redirect, affCode } = options
    const $config = useNuxtApp().$config.public
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
    const params = {
      client_id: $config.GOOGLE_OAUTH_CLIENT_ID as string,
      redirect_uri: `${$config.PUBLIC_BASE_URL}/auth`,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      response_type: 'code',
      state: JSON.stringify({
        nonce: 'random',
        redirectUrl: `${$config.PUBLIC_BASE_URL}/auth`,
        target: redirect,
        affCode: affCode
      })
    }

    location.href = url + '?' + new URLSearchParams(params)
  },
  async grantAuth(code: string, redirectUri: string, affCode: string): Promise<string> {
    const resp = await request().post<{ token: string }>({
      url: RESTMethodPath.LOGIN,
      body: {
        code,
        aff_code: affCode,
        redirect_uri: redirectUri
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
  }
}

export default () => useAuth
