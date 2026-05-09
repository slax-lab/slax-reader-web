import { PhotoSwiperDotsElement } from '../CEComponents'
import type { DOMProcessor, WebProcessorContext } from './types'
import { ArticleStyle } from './types'
import { useDebounceFn } from '@vueuse/core'

export class PhotoSwipeProcessor implements DOMProcessor {
  readonly name = 'PhotoSwipeProcessor'

  match(context: WebProcessorContext): boolean {
    return context.articleStyle === ArticleStyle.PhotoSwipeTopic
  }

  process(context: WebProcessorContext): void {
    const swiper = context.container.querySelector('slax-photo-swipe-topic > .topic-container .swiper')
    if (!swiper) return

    const count = swiper.childElementCount
    const dotsEle = new PhotoSwiperDotsElement({
      count,
      selectIndex: 0
    })

    const indexSelectedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<number[]>
      const args = customEvent.detail
      if (!args || args.length === 0) return

      dotsEle.selectIndex = args[0]
      swiper.scrollTo({
        left: args[0] * swiper.clientWidth,
        behavior: 'smooth'
      })
    }

    dotsEle.addEventListener('indexSelected', indexSelectedHandler)
    swiper.parentElement?.appendChild(dotsEle)

    const debouncedScrollFn = useDebounceFn(
      () => {
        const index = Math.round(swiper.scrollLeft / swiper.clientWidth)
        dotsEle.selectIndex = index
      },
      50,
      { maxWait: 5000 }
    )

    swiper.addEventListener('scroll', debouncedScrollFn)

    context.cleanups.push(() => {
      dotsEle.removeEventListener('indexSelected', indexSelectedHandler)
      swiper.removeEventListener('scroll', debouncedScrollFn)
    })
  }
}
