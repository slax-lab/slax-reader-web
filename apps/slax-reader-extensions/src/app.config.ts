import { googleAnalytics4 } from '@wxt-dev/analytics/providers/google-analytics-4'

export default defineAppConfig({
  analytics: {
    enabled: storage.defineItem('local:analytics-enabled', {
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
