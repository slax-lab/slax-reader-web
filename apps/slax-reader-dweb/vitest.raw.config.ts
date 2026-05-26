import { phase4ExcludeAdditions, sharedExcludeBase, sharedTestOptions } from './vitest.shared'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// 第四期 Sprint 0（2026-05-26）：raw 二轮验证 config
// 第五期收尾（2026-05-26）：raw 跑也 exclude 9 项 e2e-only 文件（4 ce.Selection + 4 ce.CEComponents + 1 RawWebPanel）
//   原因：这些文件 happy-dom 完全不可达，永远 0% 覆盖，会拉低 raw overall 失去基线含义
//   保留第三期 6 项 base exclude（types/app/error/layouts/plugins）
//   主跑与 raw 跑共享同一组 exclude，让 vitest coverage 视图彻底干净
// 不带 thresholds，仅产报表（text/html/json-summary），KPI 监控不阻塞
// reportsDirectory 独立到 coverage-raw，避免与主跑 coverage 目录互相覆盖

export default defineVitestConfig({
  test: {
    ...sharedTestOptions,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [...sharedExcludeBase, ...phase4ExcludeAdditions],
      reportsDirectory: 'coverage-raw'
    }
  }
})
