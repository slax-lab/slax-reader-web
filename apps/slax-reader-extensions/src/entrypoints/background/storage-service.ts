import { LocalStorageKey } from '@commons/types/const'
import type { UserInfo } from '@commons/types/interface'

export class StorageService {
  private userInfo = storage.defineItem<UserInfo, { lastUpdated: number }>(`${LocalStorageKey.USER_INFO}`)
  private userToken = storage.defineItem<string>(`${LocalStorageKey.USER_TOKEN}`)

  async getUserInfo(): Promise<UserInfo | null> {
    return this.userInfo.getValue()
  }

  async setUserInfo(info: UserInfo): Promise<void> {
    await this.userInfo.setValue(info)
    await this.userInfo.setMeta({ lastUpdated: Date.now() })
  }

  async getUserInfoMeta() {
    return await this.userInfo.getMeta()
  }

  async getToken(): Promise<string | null> {
    return this.userToken.getValue()
  }

  async setToken(token: string | null): Promise<void> {
    await this.userToken.setValue(token)
  }

  async clearUserData(): Promise<void> {
    await Promise.allSettled([this.userToken.removeValue(), this.userInfo.removeValue()])
  }
}
