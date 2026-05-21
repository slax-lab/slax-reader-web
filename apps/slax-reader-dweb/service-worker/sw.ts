/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope

export class NotificationWorker {
  ws: WebSocket | null = null
  lastMessage: unknown = null

  constructor() {
    this.onSocketMessage = this.onSocketMessage.bind(this)
    this.onSocketClose = this.onSocketClose.bind(this)
    this.onSocketError = this.onSocketError.bind(this)
    this.onSocketOpen = this.onSocketOpen.bind(this)
    this.onPush = this.onPush.bind(this)
    this.onNotificationclick = this.onNotificationclick.bind(this)

    console.log(`[slax sw] notification worker initialize`)
  }

  onWorkerInstall() {
    console.log(`[slax sw] notification worker install`)
    self.skipWaiting()
  }

  onWorkerActivate() {
    console.log(`[slax sw] notification worker activate`)
    self.clients.claim()
  }

  onPush(event: PushEvent) {
    if (!event.data) return
    const data = event.data.json()
    event.waitUntil(this.showNotification(data))
  }

  onNotificationclick(event: NotificationEvent) {
    event.notification.close()

    // 处理通知点击，可以打开特定页面
    const jumpUrl = event.notification.data.url || '/'
    return self.clients.openWindow(jumpUrl)
  }

  initialize() {
    // 注册基础事件
    self.addEventListener('install', this.onWorkerInstall)
    // 监听激活事件
    self.addEventListener('activate', this.onWorkerActivate)
    // 监听推送消息
    self.addEventListener('push', this.onPush)
    // 监听通知点击
    self.addEventListener('notificationclick', this.onNotificationclick)
    // 内部消息
    self.addEventListener('message', event => {
      if (event.data.type === 'connect') this.initWebsocket(event.data.data.url)
      if (event.data.type === 'ready') event.source?.postMessage(this.lastMessage)
    })
  }

  async onSocketOpen(ev: Event) {
    console.log(`[slax sw] notification worker websocket open`, ev)
  }

  async onSocketClose(ev: CloseEvent) {
    console.log(`[slax sw] notification worker websocket close`, ev)
    this.ws = null
  }

  async onSocketError(ev: Event) {
    console.log(`[slax sw] notification worker websocket error`, ev)
    this.ws = null
  }

  async onSocketMessage(event: MessageEvent) {
    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      await client.postMessage(event.data)
    }
    this.lastMessage = event.data
  }

  async initWebsocket(address: string) {
    if (this.ws) return

    const ws = new WebSocket(address)
    ws.onopen = this.onSocketOpen
    ws.onclose = this.onSocketClose
    ws.onerror = this.onSocketError
    ws.onmessage = this.onSocketMessage
    this.ws = ws
  }

  async showNotification(data: { title: string; body: string; icon: string; data: unknown }) {
    if (!self.registration) return
    console.log(`[slax sw] notification worker showNotification`)
    return self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: data.data,
      requireInteraction: true,
      tag: 'notification'
    })
  }
}
