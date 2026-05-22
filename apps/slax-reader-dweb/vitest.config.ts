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
        }

        // request.ts 第一期不设阈值（样板只测两个辅助函数，单例本身分支不在覆盖范围）
        // 第二期补完 interceptor / 401 / error 分支后启用 80/70/85/80
      }
    }
  }
})
