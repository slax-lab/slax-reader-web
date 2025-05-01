import { BrowserService } from './browserService'
import { CONFIG } from './config'
import type { StorageService } from './storageService'
import { RESTMethodPath } from '@commons/types/const'
import type { UserInfo } from '@commons/types/interface'

export class AuthService {
  private userInfoPromise: Promise<UserInfo | null> | null = null

  constructor(private storageService: StorageService) {}

  async checkLogin(): Promise<boolean> {
    let token = await this.storageService.getToken()

    if (!token) {
      const browserCookies = await browser.cookies.get({
        url: process.env.PUBLIC_BASE_URL || '',
        name: process.env.COOKIE_TOKEN_NAME || ''
      })

      if (browserCookies) {
        token = browserCookies.value
        await this.storageService.setToken(token)
      }
    }

    if (!token) {
      BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
      return false
    }

    return true
  }

  async queryUserInfo(refresh?: boolean): Promise<UserInfo | null> {
    if (refresh) {
      return await this.fetchUserInfo(true)
    }

    if (this.userInfoPromise) {
      return this.userInfoPromise
    }

    this.userInfoPromise = this.fetchUserInfo(false)

    try {
      return await this.userInfoPromise
    } finally {
      this.userInfoPromise = null
    }
  }

  private async fetchUserInfo(refresh: boolean): Promise<UserInfo | null> {
    if (!(await this.storageService.getToken())) {
      return null
    }

    if (!refresh) {
      const cache = await this.storageService.getUserInfo()
      const meta = await this.storageService.getUserInfoMeta()
      const duration = Date.now() - (meta?.lastUpdated || 0)

      if (cache && duration < CONFIG.CACHE_DURATION_MS) {
        return cache
      }
    }

    try {
      const resp = await request.get<UserInfo>({
        url: RESTMethodPath.ME,
        errorInterceptors: error => {
          console.error('Failed to fetch user info:', error)
        }
      })

      if (!resp) {
        throw new Error('Refresh user info failed')
      }

      await this.storageService.setUserInfo(resp)
      return resp
    } catch (error) {
      console.error('Error querying user info:', error)
      return null
    }
  }
}
