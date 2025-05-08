import { ObjectDirective, type DirectiveBinding } from 'vue'

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

interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: {
    handler: (e: MouseEvent) => void
    exclude?: () => HTMLElement[]
  }
}

const getElementDocument = (el: HTMLElement): Document => {
  // 如果元素有 ownerDocument 属性，则使用它
  if (el.ownerDocument) {
    return el.ownerDocument
  }

  // 查找元素所在的根节点
  let node: Node | null = el
  while (node && node.parentNode) {
    node = node.parentNode
  }

  // 检查根节点是否是 Document
  if (node && node.nodeType === Node.DOCUMENT_NODE) {
    return node as Document
  }

  // 如果找不到，则默认使用当前文档
  return document
}

export const ClickOutside: ObjectDirective = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding) {
    // 创建事件处理函数
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // 获取可能需要排除的元素
      const excludeElements: HTMLElement[] = binding.value?.exclude?.() || []

      // 检查点击是否在元素外部
      if (el !== target && !el.contains(target) && !target?.shadowRoot?.contains(el) && !excludeElements.some(elem => elem === target || elem.contains(target))) {
        // 调用绑定的函数
        const callback = binding.value?.handler || binding.value
        if (typeof callback === 'function') {
          callback(e)
        }
      }
    }

    // 保存处理函数引用，以便在卸载时移除
    el._clickOutside = { handler }

    // 添加全局点击事件监听
    getElementDocument(el).addEventListener('click', handler, true)
  },

  beforeUnmount(el: ClickOutsideElement) {
    // 移除事件监听
    if (el._clickOutside) {
      getElementDocument(el).removeEventListener('click', el._clickOutside.handler, true)
      delete el._clickOutside
    }
  },

  // 更新指令时重新绑定
  updated(el: ClickOutsideElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue) {
      // 先移除旧的
      if (el._clickOutside) {
        getElementDocument(el).removeEventListener('click', el._clickOutside.handler, true)
      }

      // 重新绑定
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const excludeElements: HTMLElement[] = binding.value?.exclude?.() || []

        if (el !== target && !el.contains(target) && !target?.shadowRoot?.contains(el) && !excludeElements.some(elem => elem === target || elem.contains(target))) {
          const callback = binding.value?.handler || binding.value
          if (typeof callback === 'function') {
            callback(e)
          }
        }
      }

      // debugger

      el._clickOutside = { handler }
      getElementDocument(el).addEventListener('click', handler, true)
    }
  }
}
