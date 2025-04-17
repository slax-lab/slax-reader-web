import { BookmarkActionType, type MessageType, MessageTypeAction } from '@/config'

import { UserIndexedDBService } from './db'
import { SlaxWebSocket } from './socket'
import { LocalStorageKey, RESTMethodPath } from '@commons/types/const'
import { type BookmarkChangelog, type BookmarkChangelogResp, type UserBookmarkChangelog, type UserInfo } from '@commons/types/interface'
import { storage } from '@wxt-dev/storage'
import { analytics } from '#analytics'
import md5 from 'md5'

export default defineBackground(() => {
  const bookmarkRecordsSyncKey = 'bookmarkRecordsSync'
  const userInfo = storage.defineItem<UserInfo, { lastUpdated: number }>(`${LocalStorageKey.USER_INFO}`)
  const userToken = storage.defineItem<string>(`${LocalStorageKey.USER_TOKEN}`)
  const userBookmarks = storage.defineItem<string[]>(`${LocalStorageKey.USER_BOOKMARKS}`, { fallback: [] })
  const dbService = new UserIndexedDBService()

  const loadSocket = () => {
    const ws = new SlaxWebSocket({
      url: 'wss://',
      autoReconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: 3
    })

    // 监听连接打开事件
    ws.on('open', event => {
      console.log('Connection established!')

      // 发送消息
      ws.send('Hello WebSocket!')

      // 发送JSON数据
      ws.sendJSON({ type: 'greeting', content: 'Hello from JSON!' })
    })

    // 监听消息事件
    ws.on('message', event => {
      console.log('Received message:', event.data)
    })

    // 监听错误事件
    ws.on('error', event => {
      console.error('WebSocket error occurred')
    })

    // 监听关闭事件
    ws.on('close', event => {
      console.log(`Connection closed. Code: ${event.code}, Reason: ${event.reason}`)
    })
  }

  const openTab = (url: string) => {
    browser.tabs.create({ url })
  }

  const checkLogin = async () => {
    let cookies = await userToken.getValue()
    if (!cookies) {
      const browserCookies = await browser.cookies.get({ url: process.env.PUBLIC_BASE_URL || '', name: process.env.COOKIE_TOKEN_NAME || '' })
      if (browserCookies) {
        cookies = browserCookies.value
      }

      await userToken.setValue(cookies)
    }

    if (!cookies) {
      openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
      return false
    }
    return true
  }

  // 打开收藏弹窗
  const openCollectPopup = async (tab: Browser.tabs.Tab, command = 'open_collect') => {
    console.log('openCollectPopup')
    if (command !== 'open_collect') return
    const res = await checkLogin()
    if (!res) return
    browser.tabs.sendMessage(tab.id!, { action: MessageTypeAction.ShowCollectPopup })
    analytics.track('click_extension_collect')
  }

  // 打开设置页面
  const openSetting = async () => {
    if (!(await checkLogin())) return
    openTab(`${process.env.PUBLIC_BASE_URL}/user`)
  }

  const queryUserInfo = async () => {
    if (!(await userToken.getValue())) {
      return null
    }

    const cache = await userInfo.getValue()
    const meta = await userInfo.getMeta()

    const duration = Date.now() - (meta?.lastUpdated || 0)

    if (cache && duration < 24 * 60 * 60 * 1000) return cache

    const resp = await request.get<UserInfo>({
      url: RESTMethodPath.ME,
      errorInterceptors: error => {
        console.log(error)
      }
    })

    if (!resp) {
      throw new Error('refresh user info failed')
    }

    await userInfo.setValue(resp)
    await userInfo.setMeta({ lastUpdated: Date.now() })

    return resp
  }

  const updateAllBookmarkRecords = async () => {
    if (!(await userToken.getValue())) {
      return
    }

    const res = await request.get<BookmarkChangelogResp<BookmarkChangelog>>({
      url: RESTMethodPath.ALL_BOOKMARK_CHANGELOGS
    })

    try {
      await dbService.initialize()
      await dbService.clearBookmarkRecords()
      await dbService.close()
    } catch (e) {}

    if (!res) {
      return
    }

    const time = res.end_time
    const logs = res.logs || []

    await addBookmarkRecords(
      logs.map(item => ({
        hashUrl: md5(item.target_url),
        bookmarkId: item.bookmark_id
      }))
    )

    await updateRecordSyncTime(Number(time))
  }

  const updatePartialBookmarkRecords = async () => {
    if (!(await userToken.getValue())) {
      return
    }

    const endTime = (await queryRecordSyncTime()) || 0

    if (endTime && Date.now() - endTime > 15 * 24 * 60 * 60 * 1000) {
      // 超过15天，直接全量更新一次
      await updateAllBookmarkRecords()
      return
    }

    const res = await request.get<BookmarkChangelogResp<UserBookmarkChangelog>>({
      url: RESTMethodPath.PARTIAL_BOOKMARK_CHANGELOGS,
      query: {
        end_time: endTime
      }
    })

    if (!res) return

    const time = res.end_time
    const logs = res.logs || []

    for (const item of logs.reverse()) {
      const hashUrl = md5(item.target_url)
      const bookmarkId = item.bookmark_id

      if (item.log_action === 'add' || item.log_action === 'update') {
        await addBookmarkRecords([
          {
            hashUrl,
            bookmarkId
          }
        ])
      } else if (item.log_action === 'delete') {
        deleteBookmarkRecord(hashUrl)
      }
    }

    await updateRecordSyncTime(time)
  }

  const cookieHost = process.env.COOKIE_DOMAIN as string

  // 监听cookie变化
  browser.cookies.onChanged.addListener(async changeInfo => {
    if ((changeInfo.cookie.domain !== cookieHost && changeInfo.cookie.domain !== `.${cookieHost}`) || changeInfo.cookie.name !== process.env.COOKIE_TOKEN_NAME) return
    console.log('cookie update', changeInfo)

    if (changeInfo.removed) {
      await Promise.allSettled([userToken.removeValue(), userBookmarks.removeValue(), userInfo.removeValue(), dbService.clearAllData()])
      return
    }

    await userToken.setValue(changeInfo.cookie.value)
    await updateAllBookmarkRecords()
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

    browser.alarms.create(bookmarkRecordsSyncKey, { periodInMinutes: 60 * 5 })

    // 注册菜单
    const menus: Browser.contextMenus.CreateProperties[] = [
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
      if (!(await userToken.getValue())) {
        return openTab(`${process.env.PUBLIC_BASE_URL}/guide?from=extension`)
      }
    } else if (reason === 'update') {
      // TODO Do something
    }

    analytics.setEnabled(true)
  })

  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === bookmarkRecordsSyncKey) {
      updatePartialBookmarkRecords()
    }
  })

  // 浏览器启动
  browser.runtime.onStartup.addListener(() => {})

  // 插件被挂起(禁用)
  browser.runtime.onSuspend.addListener(() => {})

  // 插件恢复正常
  browser.runtime.onSuspendCanceled.addListener(() => {})

  // 插件被卸载
  const uninstallUrl = process.env.UNINSTALL_FEEDBACK_URL
  uninstallUrl && browser.runtime.setUninstallURL(uninstallUrl)

  // 菜单点击事件
  const menuActions: { [key: string]: (info: Browser.contextMenus.OnClickData, tab: Browser.tabs.Tab | undefined) => void } = {
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
  browser.runtime.onMessage.addListener((message: unknown, sender: Browser.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    const receiveMessage = message as MessageType
    switch (receiveMessage.action) {
      case MessageTypeAction.OpenWelcome:
        openTab(`${process.env.PUBLIC_BASE_URL}/login?from=extension`)
        return false
      case MessageTypeAction.RecordBookmark: {
        console.log('background add bookmark..')
        const task = async () => {
          let bookmarks = await userBookmarks.getValue()
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
            await userBookmarks.setValue(bookmarks)
            await checkAndUpdateBookmarkStatus(sender.tab!.id!, url)
          }

          console.log('added bookmark')
        }

        task()

        return false
      }

      case MessageTypeAction.QueryBookmarkRecord: {
        const url = receiveMessage.url
        const hashCode = md5(url)

        queryBookmarkRecord(hashCode)
          .then(res => {
            if (res === 0) {
              sendResponse({ success: false })
            } else {
              sendResponse({ success: true, data: { bookmarkId: res } })
            }
          })
          .catch(error => {
            sendResponse({ success: false, data: error })
          })

        return true
      }

      case MessageTypeAction.AddBookmarkRecord: {
        const url = receiveMessage.url
        const bookmarkId = receiveMessage.bookmarkId
        const urlHash = md5(url)

        addBookmarkRecords([
          {
            hashUrl: urlHash,
            bookmarkId
          }
        ])
          .then(() => {
            sendResponse({ success: true })
          })
          .catch(error => {
            sendResponse({ success: false, data: error })
          })

        return true
      }

      case MessageTypeAction.CheckLogined: {
        checkLogin()
          .then(res => {
            if (!res) {
              sendResponse({
                success: false
              })
            } else {
              sendResponse({ success: true, data: res })
            }
          })
          .catch(error => {
            sendResponse({
              success: false,
              data: error
            })
          })

        return true
      }

      case MessageTypeAction.QueryUserInfo: {
        queryUserInfo().then(res => {
          sendResponse({
            success: true,
            data: res
          })
        })

        return true
      }
    }

    return false
  })

  const queryRecordSyncTime = async () => {
    const userInfo = await queryUserInfo()
    if (!userInfo) {
      return null
    }

    await dbService.initialize()
    const time = await dbService.getLastSyncTime(userInfo.userId)
    await dbService.close()

    return time || 0
  }

  const updateRecordSyncTime = async (time: number) => {
    const userInfo = await queryUserInfo()
    if (!userInfo) {
      return
    }

    await dbService.initialize()
    await dbService.updateLastSyncTime(userInfo.userId, time)
    await dbService.close()
  }

  const queryBookmarkRecord = async (hashCode: string) => {
    const userInfo = await queryUserInfo()
    if (!userInfo) {
      return null
    }

    await dbService.initialize()
    const record = await dbService.getBookmarkRecord(userInfo?.userId, hashCode)
    await dbService.close()

    if (!record) {
      return 0
    }

    return record.bookmark_id
  }

  const addBookmarkRecords = async (records: { hashUrl: string; bookmarkId: number }[]) => {
    const userInfo = await queryUserInfo()
    if (!userInfo) {
      return null
    }

    await dbService.initialize()
    await dbService.saveBookmarkRecords(records.map(record => ({ user_id: userInfo.userId, bookmark_id: record.bookmarkId, url_hash: record.hashUrl })))
    await dbService.close()
  }

  const deleteBookmarkRecord = async (hashUrl: string) => {
    const userInfo = await queryUserInfo()
    if (!userInfo) {
      return null
    }

    await dbService.initialize()
    await dbService.deleteBookmarkRecord(userInfo.userId, hashUrl)
    await dbService.close()
  }

  const checkAndUpdateBookmarkStatus = async (tabId: number, url: string) => {
    if (!tabId) {
      return
    }

    const bookmarks = await userBookmarks.getValue()

    let text = ''
    if (bookmarks.indexOf(url) !== -1) {
      console.log('include')
      text = '✓'
    }

    await browser.action.setBadgeText({ text, tabId })
  }

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
