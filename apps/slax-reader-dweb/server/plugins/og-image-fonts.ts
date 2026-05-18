export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('nuxt-og-image:context', ctx => {
    const existingFonts = Array.isArray(ctx.options.fonts) ? ctx.options.fonts : []
    ctx.options.fonts = [
      ...existingFonts,
      {
        name: 'PingFang SC',
        path: '/fonts/pingfang-sc-regular.woff',
        weight: 400,
        style: 'normal'
      }
    ]
    console.log('[og-image-fonts] injected PingFang SC, total fonts:', ctx.options.fonts.length)
  })
})
