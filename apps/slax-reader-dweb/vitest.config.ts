import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: './tests',
    include: ['**/*.spec.ts'],
    setupFiles: ['./tests/setup/index.ts'],
    environment: 'nuxt',
    testTimeout: 10000,
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        mock: {
          intersectionObserver: true,
          indexedDb: true
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [
        'layers/core/app/**/*.d.ts',
        'layers/core/app/**/types.ts',
        'layers/core/app/app.vue',
        'layers/core/app/error.vue',
        'layers/core/app/layouts/**',
        'layers/core/app/plugins/**'
        // 注意：layers/core/app/pages/** 不排除——页面承载主要业务逻辑（多个文件 400+ 行），
        // 必须纳入覆盖率分母。但第一/二期不为 pages 设局部门槛，仅观测。
      ],
      thresholds: {
        // 全局门槛第一期注释保留，等核心模块完成后再启用
        // lines: 70, branches: 65, functions: 70, statements: 70,

        // 第一期：只对已写样板的具体文件设阈值，避免未测试同目录文件按 0% 拖垮均值
        'layers/core/app/utils/string.ts': {
          lines: 90,
          branches: 85,
          functions: 90,
          statements: 90
        },
        'layers/core/app/composables/useAuth.ts': {
          lines: 80,
          branches: 70,
          functions: 90,
          statements: 80
        },

        // 第二期 sprint 1（2026-05-23 启用）：request.ts 23 用例覆盖完整
        // 实测 100/93.33/100/100，阈值给定 80/70/85/80 留 ~10pt 缓冲
        'layers/core/app/utils/request.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 2.2（2026-05-23 启用）：user.ts 54 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留 ~20pt 缓冲
        'layers/core/app/stores/user.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 3（2026-05-23 启用）：environment.ts 13 用例覆盖完整
        // 实测 100/94.44/100/100，branches 94.44% 因 v8 把 split(';')[0] ?? '' fallback 算不可达分支
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/environment.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 3（2026-05-23 启用）：DwebEnvironmentAdapter.ts 6 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Article/Selection/adapters/DwebEnvironmentAdapter.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 4（2026-05-24 启用）：modal.ts 8 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/modal.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 4（2026-05-24 启用）：Modal/index.ts 12 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Modal/index.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 5（2026-05-24 启用）：useBookmarkRelative.ts 24 用例覆盖完整
        // 实测 lines 98.24 / branches 92 / functions 86.66 / statements 98.38
        // functions 仅 86.66 因 logAnalyzed / logChat 为占位空实现（spec §1.7 决议不补测）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/useBookmarkRelative.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 6.1（2026-05-24 启用）：utils 4 个轻量文件覆盖完整
        // userRelative.ts 1 用例 → 实测 100/100/100/100
        // zip.ts 5 用例 → 实测 100/80/100/100
        // channel.ts 9 用例 → 实测 100/87.5/100/100（含 close listener）
        // analytics.ts 7 用例 → 实测 100/95.83/100/100
        // 阈值统一给定 80/70/85/80 留余量
        'layers/core/app/utils/userRelative.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/zip.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/channel.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/analytics.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 6.2（2026-05-24 启用）：chatbot.ts 27 用例覆盖完整
        // constructor 3 + createMessages 5 + handleData 13 + 边界 6
        // 实测 lines 92.66 / branches 85.36 / functions 100 / statements 92.52
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/chatbot.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        }
      }
    }
  }
})
