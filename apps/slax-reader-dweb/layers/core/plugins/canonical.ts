export default defineNuxtPlugin(() => {
  const route = useRoute()
  const config = useRuntimeConfig()

  watch(
    () => route.fullPath,
    () => {
      const baseUrl = config.public.PUBLIC_BASE_URL || 'https://r.slax.com'
      let canonicalUrl = `${baseUrl}`

      try {
        const multipleLevelPath = route.path.split('/').filter(s => s.length > 0).length > 1
        canonicalUrl = multipleLevelPath ? `${baseUrl}${route.path}` : `${baseUrl}`
      } catch (error) {
        console.error('Error setting canonical URL:', error)
      }

      useHead({
        link: [
          {
            rel: 'canonical',
            href: canonicalUrl,
            key: 'canonical'
          }
        ]
      })
    },
    { immediate: true }
  )
})
