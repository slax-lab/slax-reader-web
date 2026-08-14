import { createTestI18n } from './i18n'
import { createTestPinia } from './pinia'
import { mount, type MountingOptions } from '@vue/test-utils'
import { imeGuard } from '~~/layers/core/app/directives/imeGuard'

// 注意 global 合并顺序：先展开调用方传入的 options.global，再用合并后的 plugins 覆盖。
// 反过来写会让调用方的 plugins 字段整个覆盖默认 i18n + pinia，组件里 $t / store 注入会失败。
// v-ime-guard 由 Nuxt 插件注册（层生命周期不进测试），这里手动挂到全局指令，保持与生产一致行为。
// 注意：v-ime-guard 靠 document 捕获阶段拦截 Enter，只有元素真实挂在 document 树上
// （调用方传 attachTo: document.body）才会生效，需要该指令生效的用例自行传入。
export const mountWithApp = <T>(component: T, options: MountingOptions<any> = {}) =>
  mount(component as any, {
    ...options,
    global: {
      ...options.global,
      plugins: [createTestI18n(), createTestPinia(), ...(options.global?.plugins ?? [])],
      directives: {
        'ime-guard': imeGuard,
        ...(options.global?.directives ?? {})
      }
    }
  })
