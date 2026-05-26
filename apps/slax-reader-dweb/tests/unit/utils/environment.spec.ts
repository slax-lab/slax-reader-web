// utils/environment.ts 测试套件 —— Sprint 3
// 覆盖 getAcceptLanguage / getPreferredLanguage / isSlaxReaderApp 三个函数（13 用例）
// navigator 覆盖统一用 vi.stubGlobal，afterEach vi.unstubAllGlobals() 还原，
// 避免 Object.defineProperty descriptor 残留泄漏到后续用例。
// 服务端分支用 vi.doMock + vi.resetModules + 动态 import（沿用 request.spec.ts 范式）。
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

describe('客户端环境', () => {
  // happy-dom 默认 isClient=true，无需 vi.doMock，直接静态 import 即可看到客户端分支
  // 但 navigator 需要通过 vi.stubGlobal 控制，afterEach 还原
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getAcceptLanguage', () => {
    it('navigator.languages 非空 → 用 "," 拼接', async () => {
      vi.stubGlobal('navigator', {
        languages: ['zh-CN', 'zh', 'en-US'],
        language: 'zh-CN',
        userAgent: ''
      })
      const { getAcceptLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getAcceptLanguage()).toBe('zh-CN,zh,en-US')
    })

    it('navigator.languages 为空但 navigator.language 有值 → 返回 navigator.language', async () => {
      vi.stubGlobal('navigator', {
        languages: [],
        language: 'en-US',
        userAgent: ''
      })
      const { getAcceptLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getAcceptLanguage()).toBe('en-US')
    })

    it('navigator.languages 为空且 navigator.language 为空 → 返回 ""', async () => {
      vi.stubGlobal('navigator', {
        languages: [],
        language: '',
        userAgent: ''
      })
      const { getAcceptLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getAcceptLanguage()).toBe('')
    })
  })

  describe('getPreferredLanguage', () => {
    it('显式传入 "zh-CN,en" → "zh"', async () => {
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getPreferredLanguage('zh-CN,en')).toBe('zh')
    })

    it('显式传入 "en-US,fr" → "en"', async () => {
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getPreferredLanguage('en-US,fr')).toBe('en')
    })

    it('显式传入空字符串且 navigator 也无语言 → fallback "en"', async () => {
      vi.stubGlobal('navigator', {
        languages: [],
        language: '',
        userAgent: ''
      })
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getPreferredLanguage('')).toBe('en')
    })

    it('显式传入空字符串但 navigator 有 zh-CN → "zh"（间接调 getAcceptLanguage）', async () => {
      vi.stubGlobal('navigator', {
        languages: ['zh-CN', 'en'],
        language: 'zh-CN',
        userAgent: ''
      })
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      // 入参为空时调 getAcceptLanguage()，navigator.languages 返回 'zh-CN,en'，首个 zh 前缀命中
      expect(getPreferredLanguage('')).toBe('zh')
    })

    it('含 q 权重 "en;q=0.9,zh;q=0.8" → 截断 ";" 后遍历找首个 zh 前缀，返回 "zh"（源码不按 q 权重排序）', async () => {
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      // 源码 split(',').map(lang => lang.trim().split(';')[0].toLowerCase())
      // → ['en', 'zh']，循环遍历找首个 zh 前缀，第二个元素命中 → 'zh'
      expect(getPreferredLanguage('en;q=0.9,zh;q=0.8')).toBe('zh')
    })

    it('混合大小写 "ZH-CN,EN" → 小写比对仍返回 "zh"', async () => {
      const { getPreferredLanguage } = await import('~~/layers/core/app/utils/environment')
      expect(getPreferredLanguage('ZH-CN,EN')).toBe('zh')
    })
  })

  describe('isSlaxReaderApp', () => {
    it('navigator.userAgent 含 "SlaxReader" → true', async () => {
      vi.stubGlobal('navigator', {
        languages: [],
        language: '',
        userAgent: 'Mozilla/5.0 SlaxReader/1.0'
      })
      const { isSlaxReaderApp } = await import('~~/layers/core/app/utils/environment')
      expect(isSlaxReaderApp()).toBe(true)
    })

    it('navigator.userAgent 不含 "SlaxReader" → false', async () => {
      vi.stubGlobal('navigator', {
        languages: [],
        language: '',
        userAgent: 'Mozilla/5.0 Chrome/120.0'
      })
      const { isSlaxReaderApp } = await import('~~/layers/core/app/utils/environment')
      expect(isSlaxReaderApp()).toBe(false)
    })
  })
})

describe('服务端环境', () => {
  // vi.doMock 不会被 hoist，配合 beforeEach 的 vi.resetModules 让本 describe 单独看到 isClient=false
  beforeAll(() => {
    vi.doMock('@commons/utils/is', () => ({ isClient: false, isServer: true }))
  })

  afterAll(() => {
    vi.doUnmock('@commons/utils/is')
  })

  beforeEach(() => {
    vi.resetModules()
  })

  it('isClient=false 时 getAcceptLanguage 返回 ""', async () => {
    const { getAcceptLanguage } = await import('~~/layers/core/app/utils/environment')
    expect(getAcceptLanguage()).toBe('')
  })

  it('isClient=false 时 isSlaxReaderApp 返回 false', async () => {
    const { isSlaxReaderApp } = await import('~~/layers/core/app/utils/environment')
    expect(isSlaxReaderApp()).toBe(false)
  })
})
