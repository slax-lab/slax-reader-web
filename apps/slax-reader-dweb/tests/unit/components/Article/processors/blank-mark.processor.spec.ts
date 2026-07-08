// BlankMarkProcessor 单测
// 覆盖：纯空白容器打标记 / 含视觉子元素不打标记 / 含真实文字不打标记 /
// 嵌套候选标签时子节点非空白结论不影响父节点判断（客户端走完整 DOM 树，天然满足）
import { BLANK_FLAG_CLASS, BlankMarkProcessor } from '~~/layers/core/app/components/Article/processors/blank-mark.processor'
import type { WebProcessorContext } from '~~/layers/core/app/components/Article/processors/types'
import { ArticleStyle } from '~~/layers/core/app/components/Article/processors/types'
import { describe, expect, it } from 'vitest'

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
