import { createApp } from 'vue'

import CollectPopup from '@/components/Collect.vue'

import 'uno.css'

const extensionInvalidate = () => {
  // console.error('extension invalidated')
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    ctx.onInvalidated(extensionInvalidate)
    const ui = await createShadowRootUi(ctx, {
      name: 'slax-reader-modal',
      position: 'overlay',
      zIndex: 99999999,
      anchor: 'body',
      append: 'after',
      onMount: container => {
        container.style.position = 'fixed'
        container.style.visibility = 'visible'
        const app = createApp(CollectPopup, {
          browser
        })
        app.mount(container)
        return app
      },
      onRemove: app => {
        app?.unmount()
      }
    })

    ui.mount()
  }
})
