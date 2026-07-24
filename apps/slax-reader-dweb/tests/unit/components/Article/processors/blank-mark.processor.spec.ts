// BlankMarkProcessor 单测
import { BLANK_FLAG_CLASS, BlankMarkProcessor } from '~~/layers/core/app/components/Article/processors/blank-mark.processor'
import type { SsrElement, SsrElementHandlers, SsrEndTag, SsrRewriter, WebProcessorContext } from '~~/layers/core/app/components/Article/processors/types'
import { ArticleStyle } from '~~/layers/core/app/components/Article/processors/types'
import { describe, expect, it } from 'vitest'

// 模拟 HTMLRewriter，可手动
// 控制 onEndTag 触发时机
function createFakeRewriter() {
  const registrations: { tags: Set<string>; handlers: SsrElementHandlers }[] = []
  const rewriter: SsrRewriter = {
    on(selector, handlers) {
      registrations.push({ tags: new Set(selector.split(',').map(s => s.trim())), handlers })
      return rewriter
    }
  }

  function open(tagName: string, attrs: Record<string, string> = {}) {
    const endTagHandlers: ((endTag: SsrEndTag) => void)[] = []
    const el: SsrElement = {
      tagName,
      getAttribute: name => attrs[name] ?? null,
      setAttribute: (name, value) => {
        attrs[name] = value
      },
      onEndTag: handler => {
        endTagHandlers.push(handler)
      }
    }
    for (const reg of registrations) {
      if (reg.tags.has(tagName)) reg.handlers.element(el)
    }
    return {
      fireText(text: string) {
        for (const reg of registrations) {
          if (reg.tags.has(tagName) && reg.handlers.text) reg.handlers.text({ text, lastInTextNode: true })
        }
      },
      // 不触发即模拟回调丢失
      fireEndTag(): string[] {
        const inserted: string[] = []
        const endTag: SsrEndTag = {
          before: html => inserted.push(html),
          after: () => {},
          remove: () => {}
        }
        for (const handler of endTagHandlers) handler(endTag)
        return inserted
      }
    }
  }

  return { rewriter, open }
}

function buildContext(html: string): WebProcessorContext {
  const container = document.createElement('div')
  container.innerHTML = `<div class="html-text">${html}</div>`
  return {
    container,
    url: new URL('https://example.com/'),
    articleStyle: ArticleStyle.Default,
    callbacks: {
      screenLockUpdate: () => {},
      showImagePreview: () => {},
      websiteClick: () => {}
    },
    cleanups: []
  }
}

function hasBlankFlag(el: Element): boolean {
  return el.querySelector(`:scope > .${BLANK_FLAG_CLASS}`) !== null
}

describe('BlankMarkProcessor', () => {
  const processor = new BlankMarkProcessor()

  it('match() 始终返回 true', () => {
    expect(processor.match()).toBe(true)
  })

  it('完全空标签：打标记', () => {
    const ctx = buildContext('<section></section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(true)
  })

  it('只含空格/换行文本：打标记（:empty 判断不了这种，这正是本 processor 存在的原因）', () => {
    const ctx = buildContext('<section> \n </section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(true)
  })

  it('含真实文字：不打标记', () => {
    const ctx = buildContext('<section>real content</section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(false)
  })

  it('文字被空白格式化标签包裹（<b>  </b>）：仍判定为空白', () => {
    const ctx = buildContext('<section><b>   </b></section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(true)
  })

  it('含 img：不打标记，即使自身直接文本是空白', () => {
    const ctx = buildContext('<section><img src="x.png"></section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(false)
  })

  it('含 table：不打标记', () => {
    const ctx = buildContext('<section><table><tr><td>x</td></tr></table></section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(false)
  })

  it('嵌套候选标签：外层自身文本空白，但内部有真实内容的候选子标签 -> 外层不打标记', () => {
    const ctx = buildContext('<section id="outer">  <p id="inner">real</p>  </section>')
    processor.process(ctx)
    const outer = ctx.container.querySelector('#outer')!
    const inner = ctx.container.querySelector('#inner')!
    expect(hasBlankFlag(outer)).toBe(false)
    expect(hasBlankFlag(inner)).toBe(false)
  })

  it('嵌套候选标签：外层和内层都是空白 -> 两个都打标记', () => {
    const ctx = buildContext('<section id="outer2"> <p id="inner2"> </p> </section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('#outer2')!)).toBe(true)
    expect(hasBlankFlag(ctx.container.querySelector('#inner2')!)).toBe(true)
  })

  it('连续多个空白标签后跟真实内容：每个空白标签都单独打标记', () => {
    const ctx = buildContext('<section></section><section></section><section>visible</section>')
    processor.process(ctx)
    const sections = ctx.container.querySelectorAll('section')
    expect(hasBlankFlag(sections[0])).toBe(true)
    expect(hasBlankFlag(sections[1])).toBe(true)
    expect(hasBlankFlag(sections[2])).toBe(false)
  })

  it('容器无候选标签：不抛错', () => {
    const ctx = buildContext('<div>纯 div，没有候选标签</div>')
    expect(() => processor.process(ctx)).not.toThrow()
  })

  it('幂等：SSR 已插入 marker 的元素上重跑 process()，不会重复插入', () => {
    const ctx = buildContext(`<section id="pre-marked"><template class="${BLANK_FLAG_CLASS}"></template></section>`)
    processor.process(ctx)
    const section = ctx.container.querySelector('#pre-marked')!
    expect(section.querySelectorAll(`.${BLANK_FLAG_CLASS}`).length).toBe(1)
  })

  it('内联 style 隐藏（display:none）：即使含真实文字，仍打标记且不再深入判断', () => {
    const ctx = buildContext('<section style="display:none">real content</section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(true)
  })

  it('内联 style 隐藏（display:none）：即使含 img/table 等视觉元素，仍打标记', () => {
    const ctx = buildContext('<section style="display: none;"><img src="x.png"></section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(true)
  })

  it('style 不含 display:none（如仅 color）：不受影响，按原逻辑判断', () => {
    const ctx = buildContext('<section style="color: red">real content</section>')
    processor.process(ctx)
    expect(hasBlankFlag(ctx.container.querySelector('section')!)).toBe(false)
  })

  it('缺少 .html-text 根节点：安全跳过', () => {
    const container = document.createElement('div')
    container.innerHTML = '<section></section>'
    const ctx: WebProcessorContext = {
      container,
      url: new URL('https://example.com/'),
      articleStyle: ArticleStyle.Default,
      callbacks: { screenLockUpdate: () => {}, showImagePreview: () => {}, websiteClick: () => {} },
      cleanups: []
    }
    expect(() => processor.process(ctx)).not.toThrow()
    expect(hasBlankFlag(container.querySelector('section')!)).toBe(false)
  })
})

describe('BlankMarkProcessor SSR 保险丝：正文根容器绝不被打空白标记', () => {
  it('正常场景（栈无错位）：根容器（.html-text）自身也判定为空白，但不打标记', () => {
    const processor = new BlankMarkProcessor()
    const { rewriter, open } = createFakeRewriter()
    processor.ssr!.registerRewriter(rewriter, {})

    const root = open('div', { class: 'html-text' })
    const inserted = root.fireEndTag()

    expect(inserted).toEqual([])
  })

  it('ClassIsolationProcessor 已加 oc- 前缀（class="oc-html-text"）：同样不打标记', () => {
    const processor = new BlankMarkProcessor()
    const { rewriter, open } = createFakeRewriter()
    processor.ssr!.registerRewriter(rewriter, {})

    const root = open('div', { class: 'oc-html-text' })
    const inserted = root.fireEndTag()

    expect(inserted).toEqual([])
  })

  // 复现故障：内层 onEndTag
  // 被丢弃，root 弹出孤儿帧
  it('强制模拟栈错位（内层 onEndTag 被引擎丢弃）：根容器 onEndTag 触发时 stack.pop() 弹出的是孤儿帧，仍不打标记', () => {
    const processor = new BlankMarkProcessor()
    const { rewriter, open } = createFakeRewriter()
    processor.ssr!.registerRewriter(rewriter, {})

    const root = open('div', { class: 'html-text' })
    open('section') // 故意不触发，模拟丢弃

    const inserted = root.fireEndTag()

    expect(inserted).toEqual([])
  })

  it('非根容器不受保险丝影响：真正空白的内层候选标签仍正常打标记', () => {
    const processor = new BlankMarkProcessor()
    const { rewriter, open } = createFakeRewriter()
    processor.ssr!.registerRewriter(rewriter, {})

    const root = open('div', { class: 'html-text' })
    const inner = open('section')
    const innerInserted = inner.fireEndTag()
    const rootInserted = root.fireEndTag()

    expect(innerInserted.length).toBe(1)
    expect(rootInserted).toEqual([])
  })
})
