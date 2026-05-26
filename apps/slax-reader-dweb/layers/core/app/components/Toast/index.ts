import { createApp } from 'vue'

import Toast from './Toast.vue'

import { ToastType } from './type'

// 第四期 Sprint B.3：抽 dismissCleanup seam
// Why：onDismiss 回调依赖 Toast 内 <Transition> after-leave，happy-dom 不真触发，
//      导致 unmount + textToast.remove + 容器自清理这条链覆盖不到。
// 抽出来后 spec 可直接调 cleanup 模拟 dismiss 完成时的行为，functions 覆盖能稳定到 100%。
const buildDismissCleanup = (app: ReturnType<typeof createApp>, textToast: HTMLElement, toastElement: HTMLElement) => () => {
  app.unmount()
  textToast.remove()

  if (Array(...toastElement.children).length === 0) {
    toastElement.remove()
  }
}

const showToast = (options: { text: string; type?: ToastType }) => {
  let toastElement = document.querySelector('.toast.toast-start') as HTMLElement
  if (!toastElement) {
    toastElement = document.createElement('div')
    toastElement.classList.add('toast')
    toastElement.classList.add('toast-start')
    toastElement.style.setProperty('z-index', `${100}`)
    document.body.appendChild(toastElement)
  }

  const textToast = document.createElement('div')
  toastElement.appendChild(textToast)

  // 占位 null：必须在 createApp 之后赋值（dismissCleanup 闭包需要 app 引用）
  let dismissCleanup: (() => void) | null = null

  const app = createApp(Toast, {
    text: options.text,
    type: options.type || ToastType.Normal,
    onDismiss: () => dismissCleanup?.()
  })

  dismissCleanup = buildDismissCleanup(app, textToast, toastElement)

  app.mount(textToast)
}

export { ToastType }

export default {
  showToast
}
