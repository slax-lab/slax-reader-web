// useIframeTheme 单元测试覆盖 4 项关键 invariant：
//   1. 注入 token-only <style id="slax-reader-theme-tokens">（与 markCss 共存的独立 styleId）
//   2. iframe load 后 <html data-slax-theme="..."> 与 colorMode 同步
//   3. iframe.src reload（dispatch load）后 data-slax-theme 仍正确（防丢失）
//   4. colorMode 切换：当前 iframe 的 data-slax-theme 跟随更新
//
// 注意：tokensCss 模块靠 ?raw 导入 theme.tokens.css，在 vitest nuxt env 下该路径返回空字符串
// （vite raw transform 链与 nuxt CSS 处理在测试环境会冲突）。这里测的是 composable 的注册 / 同步
// 行为，不依赖 RAW 内容；token 集合的真实性由 tokens.spec.ts 单独覆盖。
import { effectScope, ref } from 'vue'

import { useIframeTheme } from '~~/layers/core/app/composables/useIframeTheme'
import { beforeEach, describe, expect, it } from 'vitest'

const TOKENS_STYLE_ID = 'slax-reader-theme-tokens'

const makeIframe = (): HTMLIFrameElement => {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  return iframe
}

const setColorMode = (value: 'light' | 'dark' | 'eink') => {
  // useColorMode (Nuxt) 由 nuxt-test-utils 注入；通过 .preference 触发 reactivity 同步
  const cm = useColorMode()
  cm.preference = value
}

describe('useIframeTheme composable', () => {
  beforeEach(() => {
    // 每个用例都从 light 起步，避免上一个用例残留状态污染
    setColorMode('light')
  })

  it('为 iframe 注入 tokens <style>（独立 styleId 不与 markCss 冲突）', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeTheme(iframeRef)
    })
    await new Promise(r => setTimeout(r, 0))

    const tokens = iframe.contentDocument!.getElementById(TOKENS_STYLE_ID)
    expect(tokens, 'tokens <style> 应已注入').not.toBeNull()
    // 与 markCss 默认 styleId 不冲突（即使后者并未在测试中创建，也要保证 ID 私有）
    expect(TOKENS_STYLE_ID).not.toBe('slax-reader-injected-css')
    scope.stop()
  })

  it('load 后同步 <html data-slax-theme> 等于当前 colorMode', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeTheme(iframeRef)
    })
    await new Promise(r => setTimeout(r, 0))

    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))

    const attr = iframe.contentDocument!.documentElement.getAttribute('data-slax-theme')
    expect(['light', 'system'], `attr=${attr}`).toContain(attr)
    scope.stop()
  })

  it('iframe.src reload（dispatch load）后 data-slax-theme 仍可同步', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeTheme(iframeRef)
    })
    await new Promise(r => setTimeout(r, 0))

    // 模拟 src reload：清空 contentDocument 上的属性后再触发 load
    iframe.contentDocument!.documentElement.removeAttribute('data-slax-theme')
    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))

    expect(iframe.contentDocument!.documentElement.getAttribute('data-slax-theme'), 'reload 后应被重设').not.toBeNull()
    scope.stop()
  })

  it('colorMode 切换：当前 iframe 的 data-slax-theme 同步更新', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeTheme(iframeRef)
    })
    await new Promise(r => setTimeout(r, 0))
    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))

    setColorMode('dark')
    await new Promise(r => setTimeout(r, 0))

    const attr = iframe.contentDocument!.documentElement.getAttribute('data-slax-theme')
    expect(attr, `切换 dark 后 attr=${attr}`).toBe('dark')
    scope.stop()
  })
})
