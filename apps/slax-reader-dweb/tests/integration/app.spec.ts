// 页面集成样板：进入 / 渲染 homepage、点击 CTA 跳转 /bookmarks?from=homepage
// 旧 app.nuxt.spec.ts 中的 Login 流程已不成立——app.vue 当前只是壳（<NuxtLayout><NuxtPage/>），
// / 实际渲染的是 Homepage（含 HomepageHero CTA "Start Reading Smarter - Free"）
//
// Nuxt auto-import 拦截规则（已被 Task 9 useAuth.spec.ts 验证）：
//   - mockNuxtImport 是 macro，必须在 spec 顶层调用
//   - factory 引用的 spy 必须在同文件 vi.hoisted 内声明，不能跨文件 import binding
//   - useRuntimeConfig 如要 mock 必须保留 app.baseURL，否则 setupNuxt router plugin 报错
import App from '#layers/core/app/app.vue'

import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { createTestI18n } from '~~/tests/setup/i18n'
import { createTestPinia } from '~~/tests/setup/pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 拦 navigateTo —— Homepage.vue handleStartReading 点击 CTA 时调用
const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn()
}))

mockNuxtImport('navigateTo', () => navigateToMock)

describe('/ 路由集成', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
  })

  it('进入 / 渲染 homepage 关键文案', async () => {
    await renderSuspended(App, {
      route: '/',
      global: {
        plugins: [createTestI18n(), createTestPinia()]
      }
    })

    // CTA 文案断言（HomepageHero.vue 内 .btn-free 的可见文本）
    await waitFor(() => {
      expect(screen.getByText(/Start Reading Smarter - Free/i)).toBeTruthy()
    })
  })

  it('点击 Start Reading 按钮跳转 /bookmarks?from=homepage', async () => {
    await renderSuspended(App, {
      route: '/',
      global: {
        plugins: [createTestI18n(), createTestPinia()]
      }
    })

    const cta = await screen.findByText(/Start Reading Smarter - Free/i)
    // 找到包含 CTA 文案的可点击祖先；HomepageHero.vue 中点击事件挂在外层 <span class="btn-free">
    const clickable = cta.closest('.btn-free, button, a') ?? cta
    await fireEvent.click(clickable)

    await waitFor(() => {
      expect(navigateToMock).toHaveBeenCalled()
      const arg = navigateToMock.mock.calls[0][0]
      expect(arg).toContain('/bookmarks')
      expect(arg).toContain('from=homepage')
    })
  })
})
