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

// SSR（HTMLRewriter）窄类型：只声明用到的子集， 不全局重声明 DOM Element / HTMLRewriter，便于独立 typecheck。
export interface SsrElement {
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  onEndTag(handler: () => void): void
}

export interface SsrElementHandlers {
  element(element: SsrElement): void
}

export interface SsrRewriter {
  on(selector: string, handlers: SsrElementHandlers): SsrRewriter
}

// SSR 改写上下文：字段可选，供需要的处理器用。
export interface SsrRewriteContext {
  url?: URL
  articleStyle?: ArticleStyle
}

export interface DOMProcessor {
  readonly name: string
  match(context: WebProcessorContext): boolean
  process(context: WebProcessorContext): void | Promise<void>
  // 可选：实现即视为 SSR 可用，用 HTMLRewriter 参与改写。
  ssr?: {
    registerRewriter(rewriter: SsrRewriter, ctx: SsrRewriteContext): void
  }
}
