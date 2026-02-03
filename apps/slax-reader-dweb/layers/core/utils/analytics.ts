import { isClient } from '@commons/utils/is'

import { type Analytics, getAnalytics, logEvent } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'

export const analyticsLog = (params: { event: string; value?: Record<string, string | number> }) => {
  if (!isClient) {
    return
  }

  const { gtag } = useGtag()
  gtag('event', params.event, params.value)
}

let analytics: Analytics | null = null
export const firebaseAnalyticsLog = (params: { event: string; value?: Record<string, string | number> }) => {
  if (!isClient) {
    return
  }

  if (!analytics) {
    const $config = useNuxtApp().$config.public
    const initialConfig = {
      apiKey: `${$config.FIREBASE_API_KEY || ''}`,
      authDomain: `${$config.FIREBASE_AUTH_DOMAIN || ''}`,
      databaseURL: `${$config.FIREBASE_DATABASE_URL || ''}`,
      projectId: `${$config.FIREBASE_PROJECT_ID || ''}`,
      storageBucket: `${$config.FIREBASE_STORAGE_BUCKET || ''}`,
      messagingSenderId: `${$config.FIREBASE_MESSAGING_SENDER_ID || ''}`,
      appId: `${$config.FIREBASE_APP_ID || ''}`,
      measurementId: `${$config.FIREBASE_MEASUREMENT_ID || ''}`
    }

    const app = initializeApp(initialConfig)

    analytics = getAnalytics(app)
  }

  logEvent(analytics, params.event, params.value)
}
