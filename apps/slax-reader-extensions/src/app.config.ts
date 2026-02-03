import { LocalStorageKey } from '@commons/types/const'
import { googleAnalytics4 } from '@wxt-dev/analytics/providers/google-analytics-4'

const isProduction = process.env.SLAX_ENV === 'production'
export default defineAppConfig({
  analytics: {
    enabled: storage.defineItem(LocalStorageKey.ANALYTICS_ENABLED, {
      fallback: true
    }),
    debug: !isProduction,
    providers: [
      googleAnalytics4({
        apiSecret: process.env.GOOGLE_ANALYTICS_API_SECRET + '',
        measurementId: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID + ''
      })
    ]
  }
})
