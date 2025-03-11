import { type DirectiveBinding } from 'vue'

interface ResizeElement extends HTMLElement {
  _resizeObserver?: ResizeObserver
}

export const Resize = {
  mounted(el: ResizeElement, binding: DirectiveBinding) {
    const handler = binding.value
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return

      for (const entry of entries) {
        handler(entry.target, entry.contentRect)
      }
    })

    resizeObserver.observe(el)

    el._resizeObserver = resizeObserver

    if (!binding.modifiers?.quiet) {
      handler(el, el.getBoundingClientRect())
    }
  },

  unmounted(el: ResizeElement) {
    if (!el._resizeObserver) return

    const resizeObserver = el._resizeObserver
    resizeObserver.disconnect()
    delete el._resizeObserver
  }
}
