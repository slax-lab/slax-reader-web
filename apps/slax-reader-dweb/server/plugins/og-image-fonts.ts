export default defineNitroPlugin(nitroApp => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nitroApp.hooks.hook('nuxt-og-image:context' as any, (ctx: any) => {
    const existingFonts = Array.isArray(ctx.options.fonts) ? ctx.options.fonts : []
    ctx.options.fonts = [
      ...existingFonts,
      {
        name: 'Noto Sans SC',
        path: '/fonts/noto-sans-sc-400.ttf',
        weight: 400,
        style: 'normal'
      }
    ]
  })
})
