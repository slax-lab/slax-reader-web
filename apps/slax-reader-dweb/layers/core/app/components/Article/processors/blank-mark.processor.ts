import type { DOMProcessor, SsrRewriter, WebProcessorContext } from './types'

/**
 * 标记"文本内容纯空白"的容器（抓取内容常见 CMS 块编辑器留下的空 <section></section>）。
 *
 * CSS 层面判断不了这件事：:empty 要求零子节点，连一个空格文本节点都不算 empty，
 * CSS4 的 :blank 伪类目前没有任何浏览器实现。所以只能在 DOM/HTMLRewriter 层跑一遍，
 * 把判定结果落成一个 marker 子节点，交给 CSS 用 :has() 读取。
 *
 * 候选标签收窄到纯排版容器（section/p/figure/h1-h4），不含 pre/code/table/hr/video/img：
 * 这些标签本身有 border/padding 或是自渲染元素，被误判"空白"时靠 margin collapse 兜不住，
 * 现阶段没有实际抓取样本命中过这些标签，先不处理，避免过度设计。
 */

const CANDIDATE_SELECTOR = 'section, p, figure, h1, h2, h3, h4, div'
// 出现这些标签，即使自身直接文本是空白，也不能判定为"空白容器"
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

    // 客户端拿到的是完整 DOM 树，textContent/querySelector 本身就会递归穿透所有后代，
    // 不需要像 SSR 流式解析那样手动维护栈、把子节点结论冒泡给父节点
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR))

    for (const el of candidates) {
      // 幂等：SSR 已经跑过一次 registerRewriter 插入过 marker 的话，
      // v-html 挂载后客户端会对同一份 DOM 再跑一次 process()，不能重复插入
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
      // 单一 stack：候选标签可以互相嵌套（<section><p>...</p></section>），
      // 用栈模拟"当前正在收集哪个候选元素的直接文本"
      const stack: { textBuf: string; hasVisualChild: boolean }[] = []

      rewriter
        .on(CANDIDATE_SELECTOR, {
          element(el) {
            const frame = { textBuf: '', hasVisualChild: false }
            stack.push(frame)

            el.onEndTag(endTag => {
              // 结束标签到达时才弹栈：el 本身在这次 element() 调用返回后已经失效
              // （HTMLRewriter 的 "content token" 只在本次同步回调内有效），
              // 所以标记动作必须用 onEndTag 回调传入的这个全新 endTag token
              const top = stack.pop()
              if (!top) return

              const blank = !top.hasVisualChild && isBlankText(top.textBuf)
              if (blank) {
                endTag.before(BLANK_FLAG_HTML, { html: true })
              } else {
                // 非空白：结论要冒泡给父级候选元素，
                // 否则 <section>  <p>real</p>  </section> 这种外层自身文本是空白、
                // 但内部嵌套了真实内容的情况会被误判成空白容器
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
