// 全测试一律 mock 的边界 —— 这些模块没有任何业务测试需要它们的真实行为
import { vi } from 'vitest'

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: () => []
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  onMessage: vi.fn(),
  getToken: vi.fn(),
  isSupported: vi.fn(async () => true)
}))

vi.mock('workbox-precaching', () => ({ precacheAndRoute: vi.fn() }))
vi.mock('workbox-routing', () => ({ registerRoute: vi.fn() }))
vi.mock('workbox-strategies', () => ({
  NetworkFirst: vi.fn(),
  CacheFirst: vi.fn(),
  StaleWhileRevalidate: vi.fn()
}))
vi.mock('workbox-cacheable-response', () => ({ CacheableResponsePlugin: vi.fn() }))
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: vi.fn() }))
