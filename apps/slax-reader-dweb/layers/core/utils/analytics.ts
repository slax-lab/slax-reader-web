import { isClient } from '@commons/utils/is'

import type { WebAnalyticsEvent } from '@commons/types/analytics'
import { type Analytics, getAnalytics, logEvent } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'

/**
 * Web端埋点上报函数（通过 GTM dataLayer 推送事件）
 * 使用 @nuxt/scripts 的 proxy 模式：SSR 安全、自动排队、mock 兼容
 */
export const analyticsLog = (params: WebAnalyticsEvent) => {
  try {
    const config = useRuntimeConfig()
    const { proxy } = useScriptGoogleTagManager()

    const { event, ...restParams } = params
    const enrichedParams = {
      ...restParams,
      platform: 'web',
      version: config.public.appVersion || 'unknown'
    }

    proxy.dataLayer.push({
      event,
      ...enrichedParams
    })
  } catch (error) {
    console.error('[Analytics] Track error:', error, params)
  }
}

let analytics: Analytics | null = null

/**
 * Web端埋点上报函数（Firebase Analytics）
 */
export const firebaseAnalyticsLog = (params: WebAnalyticsEvent) => {
  if (!isClient) {
    return
  }

  try {
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

    const config = useRuntimeConfig()

    const { event, ...restParams } = params
    const enrichedParams = {
      ...restParams,
      platform: 'web',
      version: config.public.appVersion || 'unknown'
    }

    logEvent(analytics, event, enrichedParams)
  } catch (error) {
    console.error('[Analytics] Firebase track error:', error, params)
  }
}
