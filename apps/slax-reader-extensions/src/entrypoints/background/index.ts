import { isSameUser } from '../../utils/jwt'

import { AuthService } from './authService'
import { BookmarkService } from './bookmarkService'
import { BrowserService } from './browserService'
import { CONFIG } from './config'
import { MessageHandler } from './messageHandler'
import { StorageService } from './storageService'

export default defineBackground(() => {
  const storageService = new StorageService()
  const authService = new AuthService(storageService)
  const bookmarkService = new BookmarkService(storageService, authService)
  const messageHandler = new MessageHandler(storageService, authService, bookmarkService)
  const userToken = ref<string>('')

  const changesCheckup = async () => {
    await Promise.allSettled([bookmarkService.updatePartialBookmarkChanges(), bookmarkService.checkSocket()])
  }

  storageService.getToken().then(token => {
    userToken.value = token || ''

    if (token) {
      // 这里的执行场景基本是用来兼容线程被休眠然后重新恢复的情况
      changesCheckup()
    }
  })

  // 监听cookie变化

  const cookieHost = process.env.COOKIE_DOMAIN as string
  browser.cookies.onChanged.addListener(changeInfo => {
    if ((changeInfo.cookie.domain !== cookieHost && changeInfo.cookie.domain !== `.${cookieHost}`) || changeInfo.cookie.name !== process.env.COOKIE_TOKEN_NAME) {
      return
    }

    console.log('Cookie update:', changeInfo)

    if (changeInfo.removed && changeInfo.cause !== 'overwrite') {
      Promise.allSettled([storageService.clearUserData(), bookmarkService.clearBookmarkData(), bookmarkService.closeSocket()])

      return
    }

    const oldToken = userToken.value
    const newToken = changeInfo.cookie.value

    // 先更新token，再更新数据，再开启socket，防止竞态数据
    storageService.setToken(newToken).then(() => {
      userToken.value = newToken

      const isSame = isSameUser(oldToken, newToken)
      if (isSame) return
      bookmarkService.updateAllBookmarkChanges().then(() => {
        bookmarkService.enableSocket()
      })
    })
  })

  // listen network change
  if ('connection' in navigator) {
    let lastStatus: 'online' | 'offline' = navigator.onLine ? 'online' : 'offline'
    // only Blink/Chromium based browsers support various parts of the NetworkInformation interface
    // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation#browser_compatibility
    // so we just can use ts-ignore here
    //@ts-ignore
    navigator.connection.addEventListener('change', (e: any) => {
      console.log(
        `effectiveType: ${e.currentTarget.effectiveType}
        rtt: ${e.currentTarget.rtt}
        downlink: ${e.currentTarget.downlink}
        saveData: ${e.currentTarget.saveData}
        type: ${e.currentTarget.type}
        online: ${navigator.onLine}`
      )
      let networkStatus = 'online'
      if (e.currentTarget.rtt === 0 || !navigator.onLine) {
        networkStatus = 'offline'
      }
      if (networkStatus !== lastStatus) {
        console.log(`network changed from ${lastStatus} to ${networkStatus}`)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastStatus = networkStatus as any
    })
  }

  // 监听插件安装事件
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    BrowserService.setupBadge()
    BrowserService.registerContextMenus()

    await browser.alarms.clear(CONFIG.BOOKMARK_RECORDS_SYNC_KEY)
    await browser.alarms.create(CONFIG.BOOKMARK_RECORDS_SYNC_KEY, {
      periodInMinutes: CONFIG.SYNC_INTERVAL_MINUTES
    })

    console.log(`Extension installed, reason: ${reason}, browser: ${import.meta.env.BROWSER}`)
    console.log(`Runtime: ${!!browser.runtime} \nCookie: ${!!browser.cookies} \nTabs: ${!!browser.tabs} \nContextMenus: ${!!browser.contextMenus} \nAction: ${!!browser.action}`)

    try {
      const cookieToken = await browser.cookies.get({
        url: `https://${cookieHost}`,
        name: process.env.COOKIE_TOKEN_NAME || ''
      })

      if (cookieToken) {
        userToken.value = cookieToken.value
        await storageService.setToken(userToken.value)
      }
    } catch (error) {
      console.error('Error getting cookie token:', error)
    }

    if (!(await storageService.getToken())) {
      reason === 'install' && BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}/guide?from=extension`)
    } else {
      await bookmarkService.updateAllBookmarkChanges()
    }

    analytics.setEnabled(true)
  })

  // 监听定时任务
  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === CONFIG.BOOKMARK_RECORDS_SYNC_KEY) {
      changesCheckup()
    }
  })

  // 设置卸载反馈URL
  const uninstallUrl = process.env.UNINSTALL_FEEDBACK_URL
  if (uninstallUrl) {
    browser.runtime.setUninstallURL(uninstallUrl)
  }

  // 菜单点击事件处理
  const menuActions: Record<string, (info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab) => void> = {
    setting: () => BrowserService.openSetting(authService),
    shortcutKeySetting: () => BrowserService.openTab('chrome://extensions/shortcuts'),
    collectList: () => BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}/bookmarks`),
    index: () => BrowserService.openTab(`${process.env.PUBLIC_BASE_URL}`),
    collect: (info, tab) => tab && BrowserService.openCollectPopup(tab, 'open_collect', authService)
  }

  // 监听菜单点击事件
  browser.contextMenus.onClicked.addListener((info, tab) => {
    const action = menuActions[info.menuItemId]
    if (action) {
      action(info, tab)
    }
  })

  // 监听插件图标点击事件
  browser.action.onClicked.addListener(tab => BrowserService.openCollectPopup(tab, 'open_collect', authService))

  // 监听快捷键
  browser.commands.onCommand.addListener((command, tab) => tab && BrowserService.openCollectPopup(tab, command, authService))

  // 监听其他页面发送的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => messageHandler.handleMessage(message, sender, sendResponse))

  // 监听标签页更新
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.status !== 'complete') return

    try {
      if (!tab.url) {
        return
      }

      const url = new URL(tab.url)
      const isValid = ['http:', 'https:'].includes(url.protocol)
      if (!isValid) {
        return
      }

      const tabInfo = await browser.tabs.get(tabId)
      if (tabInfo) {
        await bookmarkService.checkAndUpdateBookmarkStatus(tabId, tab.url)
        userToken && BrowserService.notifyUrlUpdate(tab, tab.url || '')
      }
    } catch (error) {
      console.error(`Error checking tab with id: ${tabId}`, error)
    }
  })
})
