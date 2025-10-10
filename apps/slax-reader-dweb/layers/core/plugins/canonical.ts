// plugins/canonical.ts
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const config = useRuntimeConfig()

  // 监听路由变化，确保规范标记始终指向不带参数的主 URL
  watch(
    () => route.fullPath,
    () => {
      const baseUrl = config.public.PUBLIC_BASE_URL || 'https://r.slax.com'
      let canonicalUrl = `${baseUrl}` // 默认值

      try {
        const multipleLevelPath = route.path.split('/').filter(s => s.length > 0).length > 1
        canonicalUrl = multipleLevelPath ? `${baseUrl}${route.path}` : `${baseUrl}` // 不包含查询参数
      } catch (error) {
        console.error('Error setting canonical URL:', error)
      }

      // 更新 head 中的规范标记
      useHead({
        link: [
          {
            rel: 'canonical',
            href: canonicalUrl,
            key: 'canonical'
          }
        ]
      })
      console.log(`Set canonical URL to: ${canonicalUrl} for path: ${route.fullPath}`)
    },
    { immediate: true }
  )
})
