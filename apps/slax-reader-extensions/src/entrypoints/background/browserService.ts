import { MessageTypeAction } from '@/config'

import type { AuthService } from './authService'

export class BrowserService {
  static openTab(url: string): void {
    browser.tabs.create({ url })
  }

  static async openCollectPopup(tab: Browser.tabs.Tab, command = 'open_collect', authService: AuthService): Promise<void> {
    if (command !== 'open_collect') return

    const isLoggedIn = await authService.checkLogin()
    if (!isLoggedIn) return

    browser.tabs.sendMessage(tab.id!, { action: MessageTypeAction.ShowCollectPopup })
    analytics.track('click_extension_collect')
  }

  static async openSetting(authService: AuthService): Promise<void> {
    if (!(await authService.checkLogin())) return
    this.openTab(`${process.env.PUBLIC_BASE_URL}/user`)
  }

  static setupBadge(): void {
    browser.action.setBadgeBackgroundColor({ color: '#10b981' })
    browser.action.setBadgeTextColor({ color: '#fff' })
  }

  static registerContextMenus(): void {
    const menus: Browser.contextMenus.CreateProperties[] = [
      { id: 'setting', title: i18n.t('extended_settings'), contexts: ['action'] },
      { id: 'shortcutKeySetting', title: i18n.t('shortcut_settings'), contexts: ['action'] },
      { id: 'collectList', title: i18n.t('slax_collection_list'), contexts: ['action'] },
      { id: 'collect', title: i18n.t('collect_page'), contexts: ['page'] }
    ]

    menus.forEach(item => browser.contextMenus.create(item))
  }

  static async notifyUrlUpdate(tab: Browser.tabs.Tab, url: string): Promise<void> {
    const message = { action: MessageTypeAction.PageUrlUpdate, url }
    await browser.tabs.sendMessage(tab.id!, message)
  }
}
