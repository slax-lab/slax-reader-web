import type { ExtensionAnalyticsEvent } from '@commons/types/analytics'

/**
 * Extension端埋点上报函数
 *
 * @param params - 埋点事件参数
 */
export const trackEvent = (params: ExtensionAnalyticsEvent): void => {
  try {
    const { event, ...restParams } = params
    const enrichedParams = {
      ...restParams,
      platform: 'extension',
      version: process.env.VERSION || 'unknown'
    }

    // 目前先输出到控制台用于调试
    console.log('[Extension Analytics]', event, enrichedParams)
    analytics.track(event, enrichedParams as Record<string, string>)
  } catch (error) {
    console.error('[Extension Analytics] Track error:', error, params)
  }
}
