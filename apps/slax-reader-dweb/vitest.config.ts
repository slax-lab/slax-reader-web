import { phase4ExcludeAdditions, sharedExcludeBase, sharedTestOptions, sharedThresholdsByFile } from './vitest.shared'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// 第四期 Sprint 0（2026-05-26）：方案 B（DRY）
// shared plain object 由 vitest.shared.ts 维护；此处仅装配主跑配置
// 主跑：含第三期 6 项 base exclude + 第四期 13 项新增 exclude（11 phase5 + 1 废弃 + 1 死代码），并启用全部阈值

export default defineVitestConfig({
  test: {
    ...sharedTestOptions,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [...sharedExcludeBase, ...phase4ExcludeAdditions],
      thresholds: sharedThresholdsByFile
    }
  }
})
