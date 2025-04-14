import { LocalStorageKey } from '@commons/types/const'
import { googleAnalytics4 } from '@wxt-dev/analytics/providers/google-analytics-4'

export default defineAppConfig({
  analytics: {
    enabled: storage.defineItem(LocalStorageKey.ANALYTICS_ENABLED, {
      fallback: true
    }),
    providers: [
      googleAnalytics4({
        apiSecret: process.env.GOOGLE_ANALYTICS_API_SECRET + '',
        measurementId: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID + ''
      })
    ]
  }
})
