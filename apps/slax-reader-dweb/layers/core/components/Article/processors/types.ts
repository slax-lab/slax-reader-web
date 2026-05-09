export enum ArticleStyle {
  Default = 'default',
  Twitter = 'twitter',
  PhotoSwipeTopic = 'photo-swipe-topic'
}

export interface ImagePreviewOptions {
  url: string
  frame: {
    left: number
    top: number
    width: number
    height: number
    imgWidth: number
    imgHeight: number
  }
  dismissHandler: () => void
}

export interface WebProcessorContext {
  container: HTMLElement
  url: URL
  articleStyle: ArticleStyle
  callbacks: {
    screenLockUpdate: (locked: boolean) => void
    showImagePreview: (options: ImagePreviewOptions) => void
    websiteClick: () => void
  }
  cleanups: (() => void)[]
}

export interface DOMProcessor {
  readonly name: string
  match(context: WebProcessorContext): boolean
  process(context: WebProcessorContext): void | Promise<void>
}
