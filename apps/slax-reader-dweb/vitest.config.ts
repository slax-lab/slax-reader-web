import { phase4ExcludeAdditions, sharedExcludeBase, sharedTestOptions, sharedThresholdsByFile } from './vitest.shared'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// 第四期 Sprint 0（2026-05-26）：方案 B（DRY）
// shared plain object 由 vitest.shared.ts 维护；此处仅装配主跑配置
// 主跑：含第三期 6 项 base exclude + 第四期 13 项新增 exclude（11 phase5 + 1 废弃 + 1 死代码），并启用全部阈值
// 第四期 Sprint E（2026-05-26）：global 阈值 65/55/65/65 启用（exclude 后整体兜底）

export default defineVitestConfig({
  test: {
    ...sharedTestOptions,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [...sharedExcludeBase, ...phase4ExcludeAdditions],
      thresholds: {
        // global 阈值（thresholds 顶层 lines/branches/functions/statements）
        // exclude 后整体覆盖底线；第四期实测 90.38/79.73/88.98/89.75，给定 65/55/65/65 留缓冲
        // 第五期收尾（2026-05-26）：exclude 由 13 降至 5，分母扩大；阈值升至 70/60/70/70
        lines: 70,
        branches: 60,
        functions: 70,
        statements: 70,
        ...sharedThresholdsByFile
      }
    }
  }
})
