// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: './tests',
    include: ['**/*.spec.ts'],
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
    }
  }
})
