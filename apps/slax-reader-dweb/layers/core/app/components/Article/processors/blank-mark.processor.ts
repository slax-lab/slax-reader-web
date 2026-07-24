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

// 抓取内容常见内联 style 隐藏（如 display:none 的埋点/占位段落），
// 客户端/SSR 共用同一份基于原始 style 属性字符串的判断，避免 CSSOM 解析差异
function isStyleHidden(styleAttr: string | null | undefined): boolean {
  return /display\s*:\s*none\b/i.test(styleAttr ?? '')
}

// 保险丝：根容器绝不判空白
// class 可能带 oc- 前缀
function isArticleRoot(classAttr: string | null | undefined): boolean {
  return /(?:^|\s)(?:oc-)?html-text(?:\s|$)/.test(classAttr ?? '')
}

function markBlank(el: HTMLElement): void {
  const marker = document.createElement('template')
  marker.className = BLANK_FLAG_CLASS
  el.appendChild(marker)
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

      // 已被内联 style 隐藏的容器，不管有没有真实内容都视为空白，无需再深入判断
      if (isStyleHidden(el.getAttribute('style'))) {
        markBlank(el)
        continue
      }

      if (el.querySelector(VISUAL_SELECTOR)) continue
      if (!isBlankText(el.textContent ?? '')) continue

      markBlank(el)
    }
  }

  ssr = {
    registerRewriter(rewriter: SsrRewriter): void {
      // 栈：候选标签可嵌套，跟踪当前收集的元素
      const stack: { textBuf: string; hasVisualChild: boolean }[] = []

      rewriter
        .on(CANDIDATE_SELECTOR, {
          element(el) {
            // 闭包捕获 isRoot
            // 不存进栈帧，栈可能错位
            const isRoot = isArticleRoot(el.getAttribute('class'))
            const frame = { textBuf: '', hasVisualChild: false }
            stack.push(frame)

            // style 隐藏的容器直接判空白，跳过后续文本/视觉子元素判断
            const forcedBlank = isStyleHidden(el.getAttribute('style'))

            el.onEndTag(endTag => {
              // el 已失效，插入须用 endTag token
              const top = stack.pop()
              if (!top) return

              // 保险丝：根容器触发
              // 时绝不插 marker
              if (isRoot) {
                const parent = stack[stack.length - 1]
                if (parent) parent.hasVisualChild = true
                return
              }

              const blank = forcedBlank || (!top.hasVisualChild && isBlankText(top.textBuf))
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
