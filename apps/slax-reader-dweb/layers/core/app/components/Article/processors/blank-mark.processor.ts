import type { DOMProcessor, SsrRewriter, WebProcessorContext } from './types'

/**
 * 标记纯空白容器：CSS 的 :empty/:blank 判不了，
 * 落 marker 交给 :has() 读取。
 */

const CANDIDATE_SELECTOR = 'section, p, figure, h1, h2, h3, h4, div'
// 含这些视觉元素则不算空白
const VISUAL_SELECTOR = 'img, video, svg, iframe, picture, canvas, audio, object, embed, table'

export const BLANK_FLAG_CLASS = 'oc-blank-flag'
const BLANK_FLAG_HTML = `<template class="${BLANK_FLAG_CLASS}"></template>`

function isBlankText(text: string): boolean {
  return text.trim().length === 0
}

export class BlankMarkProcessor implements DOMProcessor {
  readonly name = 'BlankMarkProcessor'

  match(): boolean {
    return true
  }

  process(context: WebProcessorContext): void {
    const root = context.container.querySelector<HTMLElement>(':scope > .html-text')
    if (!root) return

    // 客户端是完整 DOM，无需像 SSR 维护栈
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR))

    for (const el of candidates) {
      // 幂等：SSR 已插过 marker 则跳过
      if (el.querySelector(`:scope > .${BLANK_FLAG_CLASS}`)) continue
      if (el.querySelector(VISUAL_SELECTOR)) continue
      if (!isBlankText(el.textContent ?? '')) continue

      const marker = document.createElement('template')
      marker.className = BLANK_FLAG_CLASS
      el.appendChild(marker)
    }
  }

  ssr = {
    registerRewriter(rewriter: SsrRewriter): void {
      // 栈：候选标签可嵌套，跟踪当前收集的元素
      const stack: { textBuf: string; hasVisualChild: boolean }[] = []

      rewriter
        .on(CANDIDATE_SELECTOR, {
          element(el) {
            const frame = { textBuf: '', hasVisualChild: false }
            stack.push(frame)

            el.onEndTag(endTag => {
              // el 已失效，插入须用 endTag token
              const top = stack.pop()
              if (!top) return

              const blank = !top.hasVisualChild && isBlankText(top.textBuf)
              if (blank) {
                endTag.before(BLANK_FLAG_HTML, { html: true })
              } else {
                // 非空白冒泡给父级，避免外层误判
                const parent = stack[stack.length - 1]
                if (parent) parent.hasVisualChild = true
              }
            })
          },
          text(chunk) {
            const top = stack[stack.length - 1]
            if (top) top.textBuf += chunk.text
          }
        })
        .on(VISUAL_SELECTOR, {
          element() {
            const top = stack[stack.length - 1]
            if (top) top.hasVisualChild = true
          }
        })
    }
  }
}
