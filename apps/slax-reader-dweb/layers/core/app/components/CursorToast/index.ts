import { createApp } from 'vue'

import CursorToast from './CursorToast.vue'

import Toast from '#layers/core/app/components/Toast'

// 第四期 Sprint B.3：抽 dismissCleanup seam（同 Toast/index.ts 同因）
const buildDismissCleanup = (app: ReturnType<typeof createApp>, textToast: HTMLElement, toastElement: HTMLElement) => () => {
  app.unmount()
  textToast.remove()

  if (Array(...toastElement.children).length === 0) {
    toastElement.remove()
  }
}

const showToast = (options: { text: string; trackDom: HTMLElement; baseContainer?: HTMLElement; duration?: number }) => {
  const { text, trackDom, baseContainer, duration } = options
  const parent = baseContainer || document.body

  if (!trackDom || window.getComputedStyle(parent).position !== 'relative' || !parent.contains(trackDom)) {
    Toast.showToast({ text })

    return
  }

  let toastElement = document.querySelector('.cursor-toast-container') as HTMLElement
  if (!toastElement) {
    toastElement = document.createElement('div')
    toastElement.classList.add('cursor-toast-container')
    parent.appendChild(toastElement)
  }

  const textToast = document.createElement('div')
  toastElement.appendChild(textToast)

  let dismissCleanup: (() => void) | null = null

  const app = createApp(CursorToast, {
    text,
    duration,
    onDismiss: () => dismissCleanup?.()
  })

  dismissCleanup = buildDismissCleanup(app, textToast, toastElement)

  app.mount(textToast)

  const gap = 10
  const targetPosition = getRelativePosition(trackDom, parent)
  const parentRect = parent.getBoundingClientRect()
  const parentWidth = parentRect.width

  // 独立出来在这里进行定位
  textToast.style.setProperty('position', 'absolute')
  textToast.style.setProperty('z-index', `${1000}`)

  nextTick(() => {
    const size = textToast.getBoundingClientRect()
    const toastHeight = size.height
    const toastWidth = size.width
    const top = targetPosition.top >= toastHeight + gap ? targetPosition.top - toastHeight - gap : targetPosition.bottom + gap
    const left = Math.max(0, Math.min(parentWidth - toastWidth - gap, targetPosition.left + (targetPosition.width - toastWidth) / 2))

    textToast.style.setProperty('left', `${left}px`)
    textToast.style.setProperty('top', `${top}px`)
  })
}

const getRelativePosition = (child: HTMLElement, parent: HTMLElement) => {
  const childRect = child.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  const scrollTop = parent.scrollTop
  const scrollLeft = parent.scrollLeft

  return {
    top: childRect.top - parentRect.top + scrollTop,
    left: childRect.left - parentRect.left + scrollLeft,
    bottom: childRect.bottom - parentRect.top + scrollTop,
    right: childRect.right - parentRect.left + scrollLeft,
    width: childRect.width,
    height: childRect.height
  }
}

export default { showToast }
