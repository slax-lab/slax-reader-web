import { BookmarkActionType, type MessageType, MessageTypeAction } from '@/config'

import { analytics } from '@/utils/analytics'

import { LocalStorageKey } from '@commons/types/const'
import type { Menus, Runtime, Tabs } from 'wxt/browser'

export default defineBackground(() => {
  function openTab(url: string) {
    browser.tabs.create({ url })
  }

  async function checkLogin(): Promise<boolean> {
    let cookies = await storage.getItem(LocalStorageKey.USER_TOKEN)
    if (!cookies) {
      const browserCookies = await browser.cookies.get({ url: process.env.PUBLIC_BASE_URL || '', name: process.env.COOKIE_TOKEN_NAME || '' })
      if (browserCookies) {
        cookies = browserCookies.value
      }
      await storage.setItem(LocalStorageKey.USER_TOKEN, cookies)
    }

    if (!cookies) {
      openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
      return false
    }
    return true
  }

  // 打开收藏弹窗
  async function openCollectPopup(tab: Tabs.Tab, command = 'open_collect') {
    if (command !== 'open_collect') return
    await checkLogin().then(async res => {
      if (!res) return
      await browser.tabs.sendMessage(tab.id!, { action: MessageTypeAction.ShowCollectPopup })
      await analytics.fireEvent('click_extension_collect')
    })
  }

  // 打开设置页面
  async function openSetting() {
    if (!(await checkLogin())) return
    openTab(`${process.env.PUBLIC_BASE_URL}/user`)
  }

  const cookieHost = process.env.COOKIE_DOMAIN as string

  // 监听cookie变化
  browser.cookies.onChanged.addListener(changeInfo => {
    if ((changeInfo.cookie.domain !== cookieHost && changeInfo.cookie.domain !== `.${cookieHost}`) || changeInfo.cookie.name !== process.env.COOKIE_TOKEN_NAME) return
    console.log('cookie update', changeInfo)

    if (changeInfo.removed) return storage.removeItem(LocalStorageKey.USER_TOKEN)

    storage.setItem(LocalStorageKey.USER_TOKEN, changeInfo.cookie.value)
  })

  // 监听插件安装事件
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    // 设置插件图标
    browser.action.setBadgeBackgroundColor({
      color: '#10b981'
    })

    browser.action.setBadgeTextColor({
      color: '#fff'
    })

    // 注册菜单
    const menus: Menus.CreateCreatePropertiesType[] = [
      { id: 'setting', title: i18n.t('extended_settings'), contexts: ['action'] },
      { id: 'shortcutKeySetting', title: i18n.t('shortcut_settings'), contexts: ['action'] },
      { id: 'collectList', title: i18n.t('slax_collection_list'), contexts: ['action'] },
      { id: 'collect', title: i18n.t('collect_page'), contexts: ['page'] }
    ]
    menus.forEach(item => browser.contextMenus.create(item))

    // other infos
    console.log(`extension installed, reason: ${reason}, browser: ${import.meta.env.BROWSER} .`)
    console.log(`runtime: ${!!browser.runtime} \ncookie: ${!!browser.cookies} \ntabs: ${!!browser.tabs} \ncontextMenus: ${!!browser.contextMenus} \naction: ${!!browser.action}`)
    if (reason === 'install') {
      if (!(await storage.getItem(LocalStorageKey.USER_TOKEN))) {
        return openTab(`${process.env.PUBLIC_BASE_URL}/guide?from=extension`)
      }
    } else if (reason === 'update') {
      // TODO Do something
    } else if (reason === 'browser_update') {
      // TODO Do something
    }
  })

  // 插件被挂起(禁用)
  browser.runtime.onSuspend.addListener(() => {})

  // 插件恢复正常
  browser.runtime.onSuspendCanceled.addListener(() => {})

  // 插件被卸载
  const uninstallUrl = process.env.UNINSTALL_FEEDBACK_URL
  uninstallUrl && browser.runtime.setUninstallURL(uninstallUrl)

  // 菜单点击事件
  const menuActions: { [key: string]: (info: Menus.OnClickData, tab: Tabs.Tab | undefined) => void } = {
    setting: () => openSetting(),
    shortcutKeySetting: () => openTab('chrome://extensions/shortcuts'),
    collectList: () => openTab(`${process.env.PUBLIC_BASE_URL}/bookmarks`),
    index: () => openTab(`${process.env.PUBLIC_BASE_URL}`),
    collect: (info, tab) => openCollectPopup(tab!)
  }

  // 监听菜单点击事件
  browser.contextMenus.onClicked.addListener((info, tab) => menuActions[info.menuItemId]?.(info, tab))

  // 监听插件图标点击事件
  browser.action.onClicked.addListener(tab => openCollectPopup(tab))

  // 监听快捷键
  browser.commands.onCommand.addListener((command, tab) => openCollectPopup(tab!, command))

  // 监听其他页面发送的消息
  browser.runtime.onMessage.addListener(async (message: unknown, sender: Runtime.MessageSender) => {
    const receiveMessage = message as MessageType
    switch (receiveMessage.action) {
      case MessageTypeAction.OpenWelcome:
        return openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
      case MessageTypeAction.RecordBookmark: {
        console.log('background add bookmark..')
        let bookmarks = (await storage.getItem<string[]>(LocalStorageKey.USER_BOOKMARKS)) || []
        const url = receiveMessage.url

        let isEdited = false
        if (receiveMessage.actionType === BookmarkActionType.ADD && bookmarks.indexOf(url) === -1) {
          isEdited = true
          bookmarks.push(url)
        } else if (receiveMessage.actionType === BookmarkActionType.DELETE && bookmarks.indexOf(url) !== -1) {
          isEdited = true
          bookmarks = bookmarks.filter(bookmark => bookmark !== url)
        }

        console.log(sender.tab)
        if (isEdited && sender.tab?.id) {
          await storage.setItem(LocalStorageKey.USER_BOOKMARKS, bookmarks)
          await checkAndUpdateBookmarkStatus(sender.tab!.id!, url)
        }
        break
      }
      default:
        break
    }
  })

  const checkAndUpdateBookmarkStatus = async (tabId: number, url: string) => {
    if (!tabId) {
      return
    }

    const bookmarks = (await storage.getItem<string[]>(LocalStorageKey.USER_BOOKMARKS)) || []

    let text = ''
    if (bookmarks.indexOf(url) !== -1) {
      console.log('include')
      text = '✓'
    }

    await browser.action.setBadgeText({ text, tabId })
  }

  // browser.tabs.onActivated.addListener(async ({ tabId }) => {
  //   const tab = await browser.tabs.get(tabId)
  //   await checkAndUpdateBookmarkStatus(tabId, tab.url!)
  // })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.status !== 'complete') return
    try {
      const tabInfo = await browser.tabs.get(tabId)
      if (tabInfo) {
        await checkAndUpdateBookmarkStatus(tabId, tab.url!)
      } else {
        console.log(`No tab with id: ${tabId}`)
      }
    } catch (error) {
      console.log(`Error checking tab with id: ${tabId}`, error)
    }
  })
})
