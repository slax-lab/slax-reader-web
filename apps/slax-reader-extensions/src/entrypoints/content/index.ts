import { createApp } from 'vue'

import CollectPopup from '@/components/Collect.vue'
import SidePanel from '@/components/SidePanel.vue'

import '@/styles/reset.scss'
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
    const collectUI = await createShadowRootUi(ctx, {
      name: 'slax-reader-modal',
      position: 'overlay',
      zIndex: 99999999999,
      anchor: 'body',
      append: 'after',
      css: `
        html{
          z-index: 99999999999 !important;
        }
      `,
      onMount: container => {
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

    collectUI.mount()

    const panelUI = await createShadowRootUi(ctx, {
      name: 'slax-reader-panel',
      position: 'overlay',
      alignment: 'top-left',
      zIndex: 99999999999,
      anchor: 'body',
      append: 'before',
      css: `
      html{
        z-index: 99999999999 !important;
      }
    `,
      onMount: container => {
        const app = createApp(SidePanel, {
          browser
        })
        app.mount(container)
        return app
      },
      onRemove: app => {
        app?.unmount()
      }
    })

    panelUI.mount()
  }
})
