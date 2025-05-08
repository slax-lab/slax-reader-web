const isValidId = (id: string) => {
  const regex = /^[a-zA-Z][a-zA-Z0-9._-]*$/
  return regex.test(id)
}

export const getElementFullSelector = (element: HTMLElement, ignoreEles?: string[], baseParentEle?: Element) => {
  if (!element.ownerDocument.defaultView) {
    return ''
  }

  if (!(element instanceof element.ownerDocument.defaultView.Element)) {
    return ''
  }

  const path = []
  while (element && element.tagName) {
    let selector = element.tagName.toLowerCase()

    if (baseParentEle === element) {
      break
    }

    if (!ignoreEles || !ignoreEles.includes(selector)) {
      if (element.id && isValidId(element.id)) {
        selector += `#${element.id}`
      } else {
        const siblings = Array.from(element.parentNode?.children || []).filter(sibling => sibling.tagName === element.tagName)
        if (siblings.length > 1) {
          selector += `:nth-of-type(${Array.prototype.indexOf.call(siblings, element) + 1})`
        }
      }

      path.unshift(selector)
    } else {
      path.unshift('')
    }

    element = element.parentNode as HTMLElement
  }

  let haveIgnore = false
  const pathSelector = path.reduce((prev, cur) => {
    if (prev.length === 0) {
      return `${cur}`
    }

    if (cur.length === 0) {
      haveIgnore = true
    }

    if (cur.length > 0) {
      if (haveIgnore) {
        haveIgnore = false
        return `${prev} ${cur}`
      }

      return `${prev} > ${cur}`
    } else {
      haveIgnore = true
      return prev
    }
  }, '')

  return pathSelector.trim()
}

export const getNodeXPath = (node: Node) => {
  if (node.nodeType === Node.DOCUMENT_NODE) return ''

  const parts: string[] = []
  let current: Node | null = node
  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    let part = ''
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element
      part = element.tagName.toLowerCase()
      if (element.id) {
        part += `[@id="${element.id}"]`
      } else {
        let index = 1
        let sibling = element.previousElementSibling
        while (sibling) {
          if (sibling.tagName === element.tagName) index++
          sibling = sibling.previousElementSibling
        }
        if (index > 1) part += `[${index}]`
      }
    } else if (current.nodeType === Node.TEXT_NODE) {
      if (current.textContent && current.textContent.trim().length > 0) {
        let index = 1
        let sibling = current.previousSibling
        while (sibling) {
          if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent && sibling.textContent.trim().length > 0) {
            index++
          }
          sibling = sibling.previousSibling
        }
        part = `text()[${index}]`
      }
    }
    if (part) {
      parts.unshift(part)
    }
    current = current.parentNode
  }

  return '/' + parts.join('/')
}

export const removeOuterTag = (dom: Element) => {
  const parentNode = dom.parentNode
  if (!parentNode) {
    return
  }

  while (dom.firstChild) {
    parentNode.insertBefore(dom.firstChild, dom)
  }

  parentNode.removeChild(dom)
}
