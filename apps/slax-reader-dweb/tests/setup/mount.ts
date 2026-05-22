import { createTestI18n } from './i18n'
import { createTestPinia } from './pinia'
import { mount, type MountingOptions } from '@vue/test-utils'

// 注意 global 合并顺序：先展开调用方传入的 options.global，再用合并后的 plugins 覆盖。
// 反过来写会让调用方的 plugins 字段整个覆盖默认 i18n + pinia，组件里 $t / store 注入会失败。
export const mountWithApp = <T>(component: T, options: MountingOptions<any> = {}) =>
  mount(component as any, {
    ...options,
    global: {
      ...options.global,
      plugins: [createTestI18n(), createTestPinia(), ...(options.global?.plugins ?? [])]
    }
  })
