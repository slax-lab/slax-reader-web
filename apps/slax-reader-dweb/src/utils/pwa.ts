import { isUrl } from '@commons/utils/is'

export const pwaOpen = (options: { url: string; target?: string }) => {
  const { $pwa } = useNuxtApp()
  if ($pwa?.isPWAInstalled) {
    navigateTo(options.url, { external: isUrl(options.url) })
  } else {
    window.open(options.url, options.target || '_blank')
  }
}
