import { sharedExcludeBase, sharedTestOptions } from './vitest.shared'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// 第四期 Sprint 0（2026-05-26）：raw 二轮验证 config
// 仅保留第三期 6 项 base exclude（types/app/error/layouts/plugins），不含第四期新增 13 项
// 用于监控全量 raw overall（含 phase5 推迟项 / 废弃专属 / 死代码）覆盖不退化
// 不带 thresholds，仅产报表（text/html/json-summary），KPI 监控不阻塞
// reportsDirectory 独立到 coverage-raw，避免与主跑 coverage 目录互相覆盖

export default defineVitestConfig({
  test: {
    ...sharedTestOptions,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: sharedExcludeBase,
      reportsDirectory: 'coverage-raw'
    }
  }
})
