import { MessageTypeAction } from '@/config/message'

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

    try {
      await browser.tabs.sendMessage(tab.id!, message)
    } catch (error) {
      console.error('Error sending message to content script:', error)
    }
  }

  static async notifyBookmarkStatusUpdate(tab: Browser.tabs.Tab): Promise<void> {
    const message = { action: MessageTypeAction.BookmarkStatusRefresh }
    await browser.tabs.sendMessage(tab.id!, message)
  }

  // 插件置顶状态变化只在 background 特权上下文可感知（onUserSettingsChanged），
  // 主动推送给所有已打开的标签页，覆盖用户全程停留在同一可见页面点击拼图图标固定插件的场景——
  // 这种情况下 content script 侧 visibilitychange 永远不会触发
  static async notifyPinnedStatusUpdate(isOnToolbar: boolean): Promise<void> {
    const message = { action: MessageTypeAction.PinnedStatusUpdate, isOnToolbar }
    const tabs = await browser.tabs.query({ url: ['http://*/*', 'https://*/*'] })

    for (const tab of tabs) {
      if (!tab.id) continue
      try {
        await browser.tabs.sendMessage(tab.id, message)
      } catch {
        // 标签页没有注入 content script（如浏览器内置页）时会报错，忽略即可
      }
    }
  }

  // fork 与社区版 background entrypoint 各自独立文件，注册逻辑收敛到这里以避免两份重复
  static watchPinnedStatusChanges(): void {
    browser.action.onUserSettingsChanged.addListener(change => {
      if (change.isOnToolbar === undefined) return
      this.notifyPinnedStatusUpdate(change.isOnToolbar)
    })
  }
}
