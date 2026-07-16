/** 列表标题字数上限 */
export const TITLE_DISPLAY_MAX = 48

/**
 * 标题截断到 max 字，超出加省略号。
 * Array.from 计数，避免截断 emoji。
 */
export function truncateTitle(title?: string | null, max = TITLE_DISPLAY_MAX): string {
  const str = title ?? ''
  const chars = Array.from(str)
  if (chars.length <= max) return str
  return `${chars.slice(0, max).join('')}…`
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
