// useIframeStyle 单元测试覆盖 5 项关键 invariant：
//   1. options 合并模式（{ styleId } 单字段不覆盖 injectOnLoad 默认 true）
//   2. 已存在 styleId 时仅更新 textContent（不创建重复 <style>）
//   3. 监听 iframe load 事件，每次 load 注入一次
//   4. iframeRef 替换后旧 iframe 的 load listener 被 onCleanup 移除
//   5. cssContent 是 Ref<string> 时，Ref 值变化触发已存在 <style> 的 textContent 更新
import { effectScope, ref } from 'vue'

import { useIframeStyles } from '~~/layers/core/app/composables/useIframeStyle'
import { describe, expect, it } from 'vitest'

const makeIframe = (initialReadyState: 'complete' | 'loading' = 'complete'): HTMLIFrameElement => {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  // happy-dom 默认 readyState = 'complete' 后注入路径与生产 iframe 行为一致
  // initialReadyState === 'loading' 用于模拟 iframe 还在加载中（仅靠 load 事件触发注入）
  if (initialReadyState === 'loading') {
    Object.defineProperty(iframe.contentDocument, 'readyState', {
      configurable: true,
      get: () => 'loading'
    })
  }
  return iframe
}

const findStyle = (iframe: HTMLIFrameElement, id: string): HTMLStyleElement | null => {
  return iframe.contentDocument!.getElementById(id) as HTMLStyleElement | null
}

describe('useIframeStyle composable', () => {
  it('options 合并：传 { styleId } 不应让 injectOnLoad 退化为 undefined', async () => {
    // 这是修复前的"默认值陷阱"：解构 default 而非合并会让用户传一个字段时其他字段变 undefined
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeStyles(iframeRef, '.foo{color:red}', { styleId: 'custom-id' })
    })

    // immediate watch 走 setupLoadListener -> readyState=='complete' 时立即注入
    await new Promise(r => setTimeout(r, 0))
    expect(findStyle(iframe, 'custom-id'), '应已注入自定义 styleId 的 <style>').not.toBeNull()
    scope.stop()
  })

  it('已存在 styleId 时仅更新 textContent，不创建重复 <style>', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const css = ref('.a{color:red}')

    scope.run(() => {
      useIframeStyles(iframeRef, css, { styleId: 'reuse-id' })
    })
    await new Promise(r => setTimeout(r, 0))

    const before = iframe.contentDocument!.querySelectorAll('style#reuse-id').length
    css.value = '.a{color:blue}'
    await new Promise(r => setTimeout(r, 0))
    const after = iframe.contentDocument!.querySelectorAll('style#reuse-id').length

    expect(after, 'Ref 切换后 <style> 数量应保持 1').toBe(before)
    expect(after).toBe(1)
    expect(findStyle(iframe, 'reuse-id')!.textContent).toBe('.a{color:blue}')
    scope.stop()
  })

  it('监听 iframe load：dispatch load 后注入 <style>', async () => {
    const scope = effectScope()
    const iframe = makeIframe('loading') // readyState != complete 时仅靠 load 事件触发
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)

    scope.run(() => {
      useIframeStyles(iframeRef, '.b{}', { styleId: 'load-id' })
    })
    await new Promise(r => setTimeout(r, 0))

    // 模拟 iframe.src reload 完成：load 事件
    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))
    expect(findStyle(iframe, 'load-id'), 'load 后应注入 <style>').not.toBeNull()
    scope.stop()
  })

  it('iframeRef 替换：旧 iframe 的 load listener 被 onCleanup 移除', async () => {
    const scope = effectScope()
    const oldIframe = makeIframe('loading')
    const newIframe = makeIframe('loading')
    const iframeRef = ref<HTMLIFrameElement | null>(oldIframe)

    scope.run(() => {
      useIframeStyles(iframeRef, '.c{}', { styleId: 'swap-id' })
    })
    await new Promise(r => setTimeout(r, 0))

    // 切到新 iframe，旧 iframe 的 listener 应被 cleanup 移除
    iframeRef.value = newIframe
    await new Promise(r => setTimeout(r, 0))

    // 给旧 iframe dispatch load，断言没有任何 <style> 被重新注入旧 iframe
    // （正确实现下：listener 已 removeEventListener，不再触发 injectCssToIframe）
    const oldStyleCountBefore = oldIframe.contentDocument!.querySelectorAll('style#swap-id').length
    oldIframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))
    const oldStyleCountAfter = oldIframe.contentDocument!.querySelectorAll('style#swap-id').length

    expect(oldStyleCountAfter, '旧 iframe 不应再被注入').toBe(oldStyleCountBefore)
    // 新 iframe 该走 watch immediate 路径（readyState=loading 不立即注入），需 dispatch load 才注入
    expect(findStyle(newIframe, 'swap-id'), '切换瞬间新 iframe 还未 load').toBeNull()
    newIframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))
    expect(findStyle(newIframe, 'swap-id'), '新 iframe load 后应注入').not.toBeNull()
    scope.stop()
  })

  it('cssContent 是 Ref<string>：Ref 变化触发已注入 <style> 的 textContent 更新', async () => {
    const scope = effectScope()
    const iframe = makeIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const css = ref(':root{--x:1}')

    scope.run(() => {
      useIframeStyles(iframeRef, css, { styleId: 'reactive-id' })
    })
    await new Promise(r => setTimeout(r, 0))
    expect(findStyle(iframe, 'reactive-id')!.textContent).toBe(':root{--x:1}')

    css.value = ':root{--x:2}'
    await new Promise(r => setTimeout(r, 0))
    expect(findStyle(iframe, 'reactive-id')!.textContent).toBe(':root{--x:2}')
    scope.stop()
  })
})
