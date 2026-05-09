import type { DOMProcessor, WebProcessorContext } from './types'
import { ArticleStyle } from './types'

export class ImageProcessor implements DOMProcessor {
  readonly name = 'ImageProcessor'

  match(): boolean {
    return true
  }

  process(context: WebProcessorContext): void {
    const loadingKey = 'slax-image-loading'
    const imgs = Array.from(context.container.querySelectorAll('img')) as HTMLImageElement[]

    imgs.forEach(img => {
      img.srcset = ''
      img.onload = () => {
        img.classList.remove(loadingKey)

        if (context.articleStyle === ArticleStyle.PhotoSwipeTopic) {
          // PhotoSwipeTopic 模式不做尺寸调整
        } else {
          if (img.naturalWidth < 5 || img.naturalHeight < 5) {
            img.setAttribute('style', 'display: none;')
            return
          } else if (img.naturalWidth < 200) {
            img.setAttribute('style', `width: ${img.naturalWidth}px !important;`)
            return
          }

          ;[`padding: 0 !important`, `height: auto !important;`].forEach(style => {
            img.setAttribute('style', style)
          })
        }

        img.onclick = () => {
          const rect = img.getBoundingClientRect()
          const frame = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            imgWidth: img.naturalWidth,
            imgHeight: img.naturalHeight
          }

          context.callbacks.screenLockUpdate(true)
          context.callbacks.showImagePreview({
            url: img.currentSrc || img.src,
            frame,
            dismissHandler: () => {
              context.callbacks.screenLockUpdate(false)
            }
          })

          return false
        }
      }

      img.referrerPolicy = ''

      img.onerror = () => {
        img.classList.remove(loadingKey)
        img.style.display = 'none'
      }

      img.classList.add(loadingKey)

      const parentElement = img.parentElement
      const parentChilds = parentElement ? Array.from(parentElement.childNodes) : []

      const isOnlyImages = parentChilds.every(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement
          return element.tagName.toLowerCase() === 'img'
        }
        return true
      })

      if (isOnlyImages) {
        img.style.cssFloat = 'none'
      }
    })
  }
}
